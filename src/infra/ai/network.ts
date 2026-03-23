import type { MemoBoxSettings } from "../../core/config/types";
import { resolveMemoBoxAiConfiguration as resolveResolvedConfiguration } from "./configuration";

export const resolveMemoBoxAiConfiguration = resolveResolvedConfiguration;

export function shouldBypassProxyHost(hostname: string, noProxy: string): boolean {
  if (noProxy.trim() === "") {
    return false;
  }

  const normalizedHost = hostname.trim().toLowerCase();
  return noProxy
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry !== "")
    .some((entry) => {
      if (entry === "*") {
        return true;
      }

      if (entry.startsWith(".")) {
        return normalizedHost.endsWith(entry) || normalizedHost === entry.slice(1);
      }

      return normalizedHost === entry || normalizedHost.endsWith(`.${entry}`);
    });
}

export function isMemoBoxAiEnabled(settings: Pick<MemoBoxSettings, "aiEnabled">): boolean {
  return settings.aiEnabled;
}
