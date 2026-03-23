import * as http from "node:http";
import * as https from "node:https";
import { readFileSync } from "node:fs";
import { shouldBypassProxyHost } from "./network";
import type { ResolvedMemoBoxAiConfiguration } from "./configuration";

export async function runMemoBoxAiPrompt(
  resolved: ResolvedMemoBoxAiConfiguration,
  prompt: string
): Promise<string> {
  if (!resolved.enabled) {
    throw new Error("AI is disabled.");
  }

  if (!resolved.configured || !resolved.profile) {
    throw new Error(resolved.issues[0] ?? "AI is not configured.");
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
      tlsCaCert: resolved.network.tlsCaCert
    }
  );

  const parsed = JSON.parse(responseText) as {
    readonly message?: { readonly content?: string };
    readonly choices?: readonly { readonly message?: { readonly content?: string } }[];
  };

  return parsed.message?.content ?? parsed.choices?.[0]?.message?.content ?? "";
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
          reject(new Error(`AI request failed with status ${response.statusCode ?? 500}: ${responseText.slice(0, 300)}`));
          return;
        }

        resolve(responseText);
      });
    });

    request.on("error", reject);
    request.setTimeout(options.timeoutMs, () => {
      request.destroy(new Error("AI request timed out."));
    });
    request.write(body);
    request.end();
  });
}
