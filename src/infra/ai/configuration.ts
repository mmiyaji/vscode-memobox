import {
  defaultAiSettings,
  defaultAiTimeoutMs
} from "../../core/config/constants";
import type {
  MemoBoxAiNetworkSettings,
  MemoBoxAiProfileSettings,
  MemoBoxAiProvider,
  MemoBoxAiSettings,
  MemoBoxLocale,
  MemoBoxSettings
} from "../../core/config/types";
import { readMemoBoxAiSecret } from "./secrets";

export type MemoBoxAiApiKeySource = "settings" | "secretStorage" | "environment" | "none" | "notRequired";

export interface ResolvedMemoBoxAiProfile extends MemoBoxAiProfileSettings {
  readonly name: string;
  readonly apiKeyValue: string;
  readonly apiKeySource: MemoBoxAiApiKeySource;
}

export interface ResolvedMemoBoxAiConfiguration {
  readonly enabled: boolean;
  readonly configured: boolean;
  readonly issues: readonly string[];
  readonly profileName: string;
  readonly profile?: ResolvedMemoBoxAiProfile;
  readonly network: MemoBoxAiNetworkSettings;
}

export interface LegacyMemoBoxAiSettingsInput {
  readonly provider?: unknown;
  readonly endpoint?: unknown;
  readonly model?: unknown;
  readonly apiKey?: unknown;
  readonly tagLanguage?: unknown;
  readonly proxy?: unknown;
  readonly proxyBypass?: unknown;
  readonly tlsRejectUnauthorized?: unknown;
  readonly tlsCaCert?: unknown;
}

export function buildLegacyMemoBoxAiSettings(input: LegacyMemoBoxAiSettingsInput): MemoBoxAiSettings {
  return {
    defaultProfile: defaultAiSettings.defaultProfile,
    profiles: {
      local: {
        provider: normalizeProvider(input.provider, defaultAiSettings.profiles.local.provider),
        endpoint: normalizeString(input.endpoint, defaultAiSettings.profiles.local.endpoint),
        model: normalizeString(input.model, defaultAiSettings.profiles.local.model),
        apiKey: normalizeString(input.apiKey, ""),
        apiKeyEnv: "",
        tagLanguage: normalizeLocale(input.tagLanguage, defaultAiSettings.profiles.local.tagLanguage),
        timeoutMs: defaultAiTimeoutMs
      }
    },
    network: {
      proxy: normalizeString(input.proxy, ""),
      proxyBypass: normalizeString(input.proxyBypass, ""),
      tlsRejectUnauthorized: normalizeBoolean(input.tlsRejectUnauthorized, true),
      tlsCaCert: normalizeString(input.tlsCaCert, "")
    }
  };
}

export function normalizeMemoBoxAiSettings(
  rawValue: unknown,
  fallback: MemoBoxAiSettings = defaultAiSettings
): MemoBoxAiSettings {
  if (!isRecord(rawValue)) {
    return fallback;
  }

  const fallbackProfiles = normalizeProfiles(fallback.profiles, defaultAiSettings.profiles);
  const profiles = normalizeProfiles(rawValue.profiles, fallbackProfiles);
  const profileNames = Object.keys(profiles);
  const defaultProfile = normalizeString(rawValue.defaultProfile, fallback.defaultProfile);
  const selectedDefaultProfile = profileNames.includes(defaultProfile) ? defaultProfile : profileNames[0] ?? "local";

  return {
    defaultProfile: selectedDefaultProfile,
    profiles,
    network: normalizeNetwork(rawValue.network, fallback.network)
  };
}

export function resolveMemoBoxAiConfiguration(
  settings: Pick<MemoBoxSettings, "aiEnabled" | "ai">
): ResolvedMemoBoxAiConfiguration {
  return createResolvedMemoBoxAiConfiguration(settings);
}

export async function resolveMemoBoxAiConfigurationWithSecrets(
  settings: Pick<MemoBoxSettings, "aiEnabled" | "ai">
): Promise<ResolvedMemoBoxAiConfiguration> {
  const profileName = settings.ai.defaultProfile;
  const profile = settings.ai.profiles[profileName];
  const secretApiKey = profile ? await readMemoBoxAiSecret(profileName) : "";

  return createResolvedMemoBoxAiConfiguration(settings, secretApiKey);
}

function createResolvedMemoBoxAiConfiguration(
  settings: Pick<MemoBoxSettings, "aiEnabled" | "ai">,
  secretApiKey = ""
): ResolvedMemoBoxAiConfiguration {
  const profileName = settings.ai.defaultProfile;
  const profile = settings.ai.profiles[profileName];
  const issues: string[] = [];

  if (!settings.aiEnabled) {
    return {
      enabled: false,
      configured: false,
      issues,
      profileName,
      network: settings.ai.network
    };
  }

  if (!profile) {
    issues.push(`Default AI profile "${profileName}" is missing.`);
  } else {
    if (profile.endpoint.trim() === "") {
      issues.push(`AI endpoint is empty for profile "${profileName}".`);
    }

    if (profile.model.trim() === "") {
      issues.push(`AI model is empty for profile "${profileName}".`);
    }
  }

  const apiKeyResolution = profile ? resolveApiKeyValue(profile, secretApiKey) : { value: "", source: "none" as const };
  const resolvedProfile = profile
    ? {
        ...profile,
        name: profileName,
        apiKeyValue: apiKeyResolution.value,
        apiKeySource: apiKeyResolution.source
      }
    : undefined;

  if (resolvedProfile?.provider === "openai" && resolvedProfile.apiKeyValue === "") {
    issues.push(`AI API key is empty for the active OpenAI profile "${profileName}".`);
  }

  return {
    enabled: true,
    configured: issues.length === 0 && resolvedProfile !== undefined,
    issues,
    profileName,
    profile: resolvedProfile,
    network: settings.ai.network
  };
}

function resolveApiKeyValue(
  profile: MemoBoxAiProfileSettings,
  secretApiKey: string
): { readonly value: string; readonly source: MemoBoxAiApiKeySource } {
  if (profile.apiKey.trim() !== "") {
    return {
      value: profile.apiKey.trim(),
      source: "settings"
    };
  }

  if (secretApiKey.trim() !== "") {
    return {
      value: secretApiKey.trim(),
      source: "secretStorage"
    };
  }

  if (profile.apiKeyEnv.trim() !== "") {
    const value = process.env[profile.apiKeyEnv.trim()]?.trim() ?? "";
    if (value !== "") {
      return {
        value,
        source: "environment"
      };
    }
  }

  return {
    value: "",
    source: profile.provider === "openai" ? "none" : "notRequired"
  };
}

function normalizeProfiles(
  rawProfiles: unknown,
  fallbackProfiles: Readonly<Record<string, MemoBoxAiProfileSettings>>
): Readonly<Record<string, MemoBoxAiProfileSettings>> {
  if (!isRecord(rawProfiles)) {
    return fallbackProfiles;
  }

  const normalizedEntries = Object.entries(rawProfiles)
    .flatMap(([name, rawProfile]) => {
      if (!isRecord(rawProfile) || name.trim() === "") {
        return [];
      }

      const fallbackProfile = fallbackProfiles[name] ?? defaultAiSettings.profiles.local;
      return [[name, normalizeProfile(rawProfile, fallbackProfile)] as const];
    });

  return normalizedEntries.length > 0 ? Object.fromEntries(normalizedEntries) : fallbackProfiles;
}

function normalizeProfile(rawProfile: Record<string, unknown>, fallback: MemoBoxAiProfileSettings): MemoBoxAiProfileSettings {
  return {
    provider: normalizeProvider(rawProfile.provider, fallback.provider),
    endpoint: normalizeString(rawProfile.endpoint, fallback.endpoint),
    model: normalizeString(rawProfile.model, fallback.model),
    apiKey: normalizeString(rawProfile.apiKey, fallback.apiKey),
    apiKeyEnv: normalizeString(rawProfile.apiKeyEnv, fallback.apiKeyEnv),
    tagLanguage: normalizeLocale(rawProfile.tagLanguage, fallback.tagLanguage),
    timeoutMs: normalizeTimeout(rawProfile.timeoutMs, fallback.timeoutMs)
  };
}

function normalizeNetwork(rawNetwork: unknown, fallback: MemoBoxAiNetworkSettings): MemoBoxAiNetworkSettings {
  if (!isRecord(rawNetwork)) {
    return fallback;
  }

  return {
    proxy: normalizeString(rawNetwork.proxy, fallback.proxy),
    proxyBypass: normalizeString(rawNetwork.proxyBypass, fallback.proxyBypass),
    tlsRejectUnauthorized: normalizeBoolean(rawNetwork.tlsRejectUnauthorized, fallback.tlsRejectUnauthorized),
    tlsCaCert: normalizeString(rawNetwork.tlsCaCert, fallback.tlsCaCert)
  };
}

function normalizeTimeout(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function normalizeProvider(value: unknown, fallback: MemoBoxAiProvider): MemoBoxAiProvider {
  return value === "ollama" || value === "openai" ? value : fallback;
}

function normalizeLocale(value: unknown, fallback: MemoBoxLocale): MemoBoxLocale {
  return value === "auto" || value === "ja" || value === "en" ? value : fallback;
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
