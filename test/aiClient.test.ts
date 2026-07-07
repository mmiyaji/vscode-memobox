import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";
import type * as http from "node:http";
import type * as https from "node:https";
import type { Socket } from "node:net";
import { PassThrough } from "node:stream";
import type { ResolvedMemoBoxAiConfiguration } from "../src/infra/ai/configuration";

const requireModule = createRequire(`${process.cwd()}/test/aiClient.test.ts`);

/* eslint-disable no-unused-vars */
type EndHandler = (_body: string) => void;
type ResponseCallback = (_response: http.IncomingMessage) => void;
/* eslint-enable no-unused-vars */

class MockClientRequest extends EventEmitter {
  private readonly chunks: Buffer[] = [];
  private readonly onEnd: EndHandler;

  public constructor(onEnd?: EndHandler) {
    super();
    this.onEnd = onEnd ?? (() => undefined);
  }

  public setTimeout(): this {
    return this;
  }

  public write(chunk: string | Buffer): boolean {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return true;
  }

  public end(): this {
    this.onEnd(Buffer.concat(this.chunks).toString("utf8"));
    return this;
  }

  public destroy(error?: Error): this {
    if (error) {
      this.emit("error", error);
    }
    this.emit("close");
    return this;
  }
}

test("runMemoBoxAiPrompt uses CONNECT for HTTPS targets through an HTTP proxy", async (context) => {
  const connectRequests: https.RequestOptions[] = [];
  const targetRequests: https.RequestOptions[] = [];
  let targetBody = "";
  const httpModule = requireModule("node:http") as typeof http;
  const httpsModule = requireModule("node:https") as typeof https;

  context.mock.method(httpModule, "request", ((options: string | URL | http.RequestOptions) => {
    assert.equal(typeof options, "object");
    const requestOptions = options as https.RequestOptions;
    connectRequests.push(requestOptions);

    const request = new MockClientRequest(() => {
      const response = createIncomingMessage(200);
      const socket = new PassThrough() as unknown as Socket;
      process.nextTick(() => {
        request.emit("connect", response, socket, Buffer.alloc(0));
      });
    });

    return request as unknown as http.ClientRequest;
  }) as typeof http.request);

  context.mock.method(httpsModule, "request", ((options: string | URL | https.RequestOptions, callback?: ResponseCallback) => {
    assert.equal(typeof options, "object");
    const requestOptions = options as https.RequestOptions;
    targetRequests.push(requestOptions);

    const request = new MockClientRequest((body) => {
      targetBody = body;
      const response = createIncomingMessage(200);
      callback?.(response);
      process.nextTick(() => {
        response.emit("data", Buffer.from(JSON.stringify({
          choices: [{ message: { content: "proxied ok" } }]
        })));
        response.emit("end");
      });
    });

    return request as unknown as http.ClientRequest;
  }) as typeof https.request);

  const { runMemoBoxAiPrompt } = await import("../src/infra/ai/client");
  const output = await runMemoBoxAiPrompt(createResolvedOpenAiConfig(), "hello");

  assert.equal(output, "proxied ok");
  assert.equal(connectRequests.length, 1);
  assert.equal(connectRequests[0]?.method, "CONNECT");
  assert.equal(connectRequests[0]?.path, "api.example.test:443");
  const connectHeaders = connectRequests[0]?.headers as http.OutgoingHttpHeaders | undefined;
  assert.equal(connectHeaders?.Authorization, undefined);
  assert.equal(connectHeaders?.authorization, undefined);
  assert.equal(targetRequests.length, 1);
  assert.equal(targetRequests[0]?.path, "/chat/completions");
  const targetHeaders = targetRequests[0]?.headers as http.OutgoingHttpHeaders | undefined;
  assert.equal(targetHeaders?.Authorization, "Bearer test-key");
  assert.equal(typeof targetRequests[0]?.createConnection, "function");
  assert.match(targetBody, /"model":"gpt-test"/);
});

function createIncomingMessage(statusCode: number): http.IncomingMessage {
  const response = new EventEmitter() as http.IncomingMessage;
  response.statusCode = statusCode;
  return response;
}

function createResolvedOpenAiConfig(): ResolvedMemoBoxAiConfiguration {
  return {
    enabled: true,
    configured: true,
    issues: [],
    profileName: "test",
    profile: {
      name: "test",
      provider: "openai",
      endpoint: "https://api.example.test",
      model: "gpt-test",
      apiKey: "",
      apiKeyEnv: "",
      apiKeyValue: "test-key",
      apiKeySource: "settings",
      tagLanguage: "auto",
      timeoutMs: 5000
    },
    network: {
      proxy: "http://proxy.example.test:8080",
      proxyBypass: "",
      tlsRejectUnauthorized: true,
      tlsCaCert: ""
    }
  };
}
