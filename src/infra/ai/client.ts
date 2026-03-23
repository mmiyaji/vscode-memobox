import * as http from "node:http";
import * as https from "node:https";
import { readFileSync } from "node:fs";
import { shouldBypassProxyHost } from "./network";
import type { ResolvedMemoBoxAiConfiguration } from "./configuration";

type MemoBoxAiErrorCode =
  | "disabled"
  | "misconfigured"
  | "cancelled"
  | "timeout"
  | "network"
  | "authentication"
  | "model_not_found"
  | "invalid_response"
  | "empty_response";

export class MemoBoxAiError extends Error {
  public readonly code: MemoBoxAiErrorCode;

  public constructor(message: string, code: MemoBoxAiErrorCode) {
    super(message);
    this.name = "MemoBoxAiError";
    this.code = code;
  }
}

interface RunMemoBoxAiPromptOptions {
  readonly signal?: AbortSignal;
}

export async function runMemoBoxAiPrompt(
  resolved: ResolvedMemoBoxAiConfiguration,
  prompt: string,
  options: RunMemoBoxAiPromptOptions = {}
): Promise<string> {
  if (!resolved.enabled) {
    throw new MemoBoxAiError("AI is disabled.", "disabled");
  }

  if (!resolved.configured || !resolved.profile) {
    throw new MemoBoxAiError(resolved.issues[0] ?? "AI is not configured.", "misconfigured");
  }

  const profile = resolved.profile;
  const baseUrl = profile.endpoint.replace(/\/$/, "");
  const url = profile.provider === "ollama" ? `${baseUrl}/api/chat` : `${baseUrl}/chat/completions`;
  const requestBody: Record<string, unknown> = {
    model: profile.model,
    messages: [{ role: "user", content: prompt }],
    stream: false
  };

  if (profile.provider === "ollama") {
    requestBody.think = false;
  } else {
    requestBody.temperature = 0.3;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (profile.apiKeyValue !== "") {
    headers.Authorization = `Bearer ${profile.apiKeyValue}`;
  }

  const responseText = await sendJsonRequest(
    url,
    {
      method: "POST",
      headers,
      timeoutMs: profile.timeoutMs
    },
    JSON.stringify(requestBody),
    {
      proxy: resolved.network.proxy,
      proxyBypass: resolved.network.proxyBypass,
      tlsRejectUnauthorized: resolved.network.tlsRejectUnauthorized,
      tlsCaCert: resolved.network.tlsCaCert,
      provider: profile.provider,
      signal: options.signal
    }
  );

  let parsed: {
    readonly message?: { readonly content?: string };
    readonly choices?: readonly { readonly message?: { readonly content?: string } }[];
  };

  try {
    parsed = JSON.parse(responseText) as {
      readonly message?: { readonly content?: string };
      readonly choices?: readonly { readonly message?: { readonly content?: string } }[];
    };
  } catch {
    throw new MemoBoxAiError("AI returned an invalid JSON response.", "invalid_response");
  }

  const content = (parsed.message?.content ?? parsed.choices?.[0]?.message?.content ?? "").trim();
  if (content === "") {
    throw new MemoBoxAiError("AI returned an empty response.", "empty_response");
  }

  return content;
}

interface JsonRequestOptions {
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly timeoutMs: number;
}

interface ResolvedNetworkOptions {
  readonly proxy: string;
  readonly proxyBypass: string;
  readonly tlsRejectUnauthorized: boolean;
  readonly tlsCaCert: string;
  readonly provider: "ollama" | "openai";
  readonly signal?: AbortSignal;
}

async function sendJsonRequest(
  url: string,
  options: JsonRequestOptions,
  body: string,
  network: ResolvedNetworkOptions
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const useProxy = network.proxy.trim() !== "" && !shouldBypassProxyHost(parsedUrl.hostname, network.proxyBypass);
    const proxyUrl = useProxy ? new URL(network.proxy) : undefined;
    const requestOptions: https.RequestOptions = useProxy
      ? {
          method: options.method,
          headers: {
            ...options.headers,
            Host: parsedUrl.host
          },
          hostname: proxyUrl?.hostname,
          port: proxyUrl?.port || (proxyUrl?.protocol === "https:" ? 443 : 80),
          path: url,
          protocol: proxyUrl?.protocol
        }
      : {
          method: options.method,
          headers: options.headers,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          protocol: parsedUrl.protocol
        };

    if (!network.tlsRejectUnauthorized) {
      requestOptions.rejectUnauthorized = false;
    }

    if (network.tlsCaCert.trim() !== "") {
      try {
        requestOptions.ca = readFileSync(network.tlsCaCert);
      } catch {
        // Ignore missing CA bundle and let the request fail normally if needed.
      }
    }

    const transport = (useProxy ? proxyUrl?.protocol : parsedUrl.protocol) === "https:" ? https : http;
    const request = transport.request(requestOptions, (response) => {
      const chunks: Buffer[] = [];

      response.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      response.on("end", () => {
        const responseText = Buffer.concat(chunks).toString("utf8");
        if ((response.statusCode ?? 500) >= 400) {
          reject(buildHttpError(response.statusCode ?? 500, responseText, network.provider, parsedUrl.toString()));
          return;
        }

        resolve(responseText);
      });
    });

    const abortHandler = () => {
      request.destroy(new MemoBoxAiError("AI request was cancelled.", "cancelled"));
    };

    if (network.signal) {
      if (network.signal.aborted) {
        abortHandler();
        return;
      }

      network.signal.addEventListener("abort", abortHandler, { once: true });
    }

    request.on("error", (error) => {
      if (network.signal) {
        network.signal.removeEventListener("abort", abortHandler);
      }

      reject(normalizeTransportError(error, network.provider, parsedUrl.toString()));
    });
    request.setTimeout(options.timeoutMs, () => {
      request.destroy(new MemoBoxAiError(`AI request timed out after ${options.timeoutMs} ms.`, "timeout"));
    });
    request.on("close", () => {
      if (network.signal) {
        network.signal.removeEventListener("abort", abortHandler);
      }
    });
    request.write(body);
    request.end();
  });
}

function buildHttpError(
  statusCode: number,
  responseText: string,
  provider: "ollama" | "openai",
  endpoint: string
): MemoBoxAiError {
  const extractedMessage = extractResponseErrorMessage(responseText);
  const normalizedMessage = extractedMessage.toLowerCase();

  if (statusCode === 401 || statusCode === 403) {
    return new MemoBoxAiError(
      provider === "openai"
        ? "AI authentication failed. Check the API key or active profile."
        : "AI endpoint rejected the request. Check the configured credentials.",
      "authentication"
    );
  }

  if (statusCode === 404 && normalizedMessage.includes("model") && normalizedMessage.includes("not found")) {
    return new MemoBoxAiError("AI model was not found. Check the configured model name.", "model_not_found");
  }

  if (normalizedMessage.includes("model") && normalizedMessage.includes("not found")) {
    return new MemoBoxAiError("AI model was not found. Check the configured model name.", "model_not_found");
  }

  const suffix = extractedMessage === "" ? "" : ` ${extractedMessage}`;
  return new MemoBoxAiError(
    `AI request failed with status ${statusCode} at ${endpoint}.${suffix}`.trim(),
    "network"
  );
}

function extractResponseErrorMessage(responseText: string): string {
  const trimmed = responseText.trim();
  if (trimmed === "") {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      readonly error?: string | { readonly message?: string };
      readonly message?: string;
    };

    if (typeof parsed.error === "string") {
      return parsed.error.trim();
    }

    if (typeof parsed.error?.message === "string") {
      return parsed.error.message.trim();
    }

    if (typeof parsed.message === "string") {
      return parsed.message.trim();
    }
  } catch {
    // Fall through to plain text handling.
  }

  return trimmed.slice(0, 240);
}

function normalizeTransportError(
  error: unknown,
  provider: "ollama" | "openai",
  endpoint: string
): Error {
  if (error instanceof MemoBoxAiError) {
    return error;
  }

  const nodeError = error as NodeJS.ErrnoException | undefined;
  switch (nodeError?.code) {
    case "ECONNREFUSED":
      return new MemoBoxAiError(
        provider === "ollama"
          ? `Could not connect to Ollama at ${endpoint}. Start Ollama or check the endpoint URL.`
          : `Could not connect to the AI endpoint at ${endpoint}. Check the endpoint URL and network access.`,
        "network"
      );
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return new MemoBoxAiError(`Could not resolve the AI host for ${endpoint}. Check the endpoint URL.`, "network");
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
    case "SELF_SIGNED_CERT_IN_CHAIN":
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
      return new MemoBoxAiError(
        "TLS verification failed for the AI endpoint. Check tlsRejectUnauthorized or the configured CA bundle.",
        "network"
      );
    default:
      return error instanceof Error ? error : new MemoBoxAiError("AI request failed.", "network");
  }
}
