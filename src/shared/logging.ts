import type { MemoBoxLogLevel } from "../core/config/types";

type MemoBoxLogTarget = "general" | "ai";
type MemoBoxLogSeverity = Exclude<MemoBoxLogLevel, "off">;

/* eslint-disable no-unused-vars */
interface OutputChannelLike {
  appendLine(_value: string): void;
  show(_preserveFocus?: boolean): void;
}
/* eslint-enable no-unused-vars */

interface MemoBoxLoggingOptions {
  readonly generalChannel: OutputChannelLike;
  readonly aiChannel: OutputChannelLike;
  readonly getLogLevel: () => MemoBoxLogLevel;
}

let generalChannel: OutputChannelLike | undefined;
let aiChannel: OutputChannelLike | undefined;
let getLogLevel: () => MemoBoxLogLevel = () => "off";

const severityWeight: Record<MemoBoxLogSeverity, number> = {
  error: 1,
  warn: 2,
  info: 3
};

export function initializeMemoBoxLogging(options: MemoBoxLoggingOptions): void {
  generalChannel = options.generalChannel;
  aiChannel = options.aiChannel;
  getLogLevel = options.getLogLevel;
}

export function resetMemoBoxLoggingForTest(): void {
  generalChannel = undefined;
  aiChannel = undefined;
  getLogLevel = () => "off";
}

export function showMemoBoxLogs(): void {
  generalChannel?.show(true);
}

export function showMemoBoxAiLogs(): void {
  aiChannel?.show(true);
}

export function logMemoBoxInfo(scope: string, message: string, metadata?: Record<string, unknown>): void {
  appendLog("general", "info", scope, message, metadata);
}

export function logMemoBoxWarn(scope: string, message: string, metadata?: Record<string, unknown>): void {
  appendLog("general", "warn", scope, message, metadata);
}

export function logMemoBoxError(scope: string, message: string, metadata?: Record<string, unknown>): void {
  appendLog("general", "error", scope, message, metadata);
}

export function logMemoBoxAiInfo(scope: string, message: string, metadata?: Record<string, unknown>): void {
  appendLog("ai", "info", scope, message, metadata);
}

export function logMemoBoxAiWarn(scope: string, message: string, metadata?: Record<string, unknown>): void {
  appendLog("ai", "warn", scope, message, metadata);
}

export function logMemoBoxAiError(scope: string, message: string, metadata?: Record<string, unknown>): void {
  appendLog("ai", "error", scope, message, metadata);
}

function appendLog(
  target: MemoBoxLogTarget,
  severity: MemoBoxLogSeverity,
  scope: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const configuredLevel = getLogLevel();
  if (configuredLevel === "off") {
    return;
  }

  if (severityWeight[severity] > severityWeight[configuredLevel]) {
    return;
  }

  const outputChannel = target === "ai" ? aiChannel : generalChannel;
  if (!outputChannel) {
    return;
  }

  outputChannel.appendLine(formatLogLine(severity, scope, message, metadata));
}

function formatLogLine(
  severity: MemoBoxLogSeverity,
  scope: string,
  message: string,
  metadata?: Record<string, unknown>
): string {
  const base = `[${new Date().toISOString()}] [${severity.toUpperCase()}] [${scope}] ${message}`;
  const serializedMetadata = formatMetadata(metadata);
  return serializedMetadata === "" ? base : `${base} | ${serializedMetadata}`;
}

function formatMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata) {
    return "";
  }

  return Object.entries(metadata)
    .flatMap(([key, value]) => {
      if (value === undefined) {
        return [];
      }

      return [`${key}=${serializeValue(value)}`];
    })
    .join(" ");
}

function serializeValue(value: unknown): string {
  if (typeof value === "string") {
    return JSON.stringify(value.length > 240 ? `${value.slice(0, 237)}...` : value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
