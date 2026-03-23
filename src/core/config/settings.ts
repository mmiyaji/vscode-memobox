import * as vscode from "vscode";
import type { MemoBoxSettings } from "./types";
import {
  configurationSection,
  defaultAiSettings,
  defaultDatePathFormat,
  defaultExcludeDirectories,
  defaultGrepViewMode,
  defaultListDisplayExtname,
  defaultLogLevel,
  defaultListSortOrder,
  defaultMaxScanDepth,
  defaultMetaDir,
  defaultQuickMemoDateFormat,
  defaultQuickMemoTitlePrefix,
  defaultRelatedMemoLimit,
  defaultSearchMaxResults,
  defaultTodoPattern
} from "./constants";
import { buildLegacyMemoBoxAiSettings, normalizeMemoBoxAiSettings } from "../../infra/ai/configuration";

export function readSettings(): MemoBoxSettings {
  const config = vscode.workspace.getConfiguration(configurationSection);

  return {
    memodir: readCompatibleStringSetting(config, "memodir", "", []).trim(),
    datePathFormat: readCompatibleStringSetting(config, "datePathFormat", defaultDatePathFormat, ["memoDatePathFormat"]).trim(),
    memotemplate: readCompatibleStringSetting(config, "memotemplate", "", []).trim(),
    metaDir: readCompatibleStringSetting(config, "metaDir", defaultMetaDir, ["memoMetaDir"]).trim() || defaultMetaDir,
    templatesDir: readCompatibleStringSetting(config, "templatesDir", "", ["memoTemplatesDir"]).trim(),
    snippetsDir: readCompatibleStringSetting(config, "snippetsDir", "", ["memoSnippetsDir"]).trim(),
    searchMaxResults: normalizePositiveCount(readCompatibleSetting(config, "searchMaxResults", defaultSearchMaxResults), defaultSearchMaxResults),
    relatedMemoLimit: normalizePositiveCount(readCompatibleSetting(config, "relatedMemoLimit", defaultRelatedMemoLimit), defaultRelatedMemoLimit),
    excludeDirectories: readDirectoryNameList(
      readCompatibleSetting(config, "excludeDirectories", [...defaultExcludeDirectories]),
      defaultExcludeDirectories
    ),
    maxScanDepth: normalizeScanDepth(readCompatibleSetting(config, "maxScanDepth", defaultMaxScanDepth)),
    listSortOrder: readCompatibleSetting(config, "listSortOrder", defaultListSortOrder),
    listDisplayExtname: readListDisplayExtname(readCompatibleSetting(config, "listDisplayExtname", [...defaultListDisplayExtname])),
    displayFileBirthTime: readCompatibleSetting(config, "displayFileBirthTime", false),
    openMarkdownPreview: readCompatibleSetting(config, "openMarkdownPreview", false),
    grepViewMode: readCompatibleSetting(config, "grepViewMode", defaultGrepViewMode, ["memoGrepViewMode"]),
    todoPattern: readCompatibleStringSetting(config, "todoPattern", defaultTodoPattern, ["memoTodoUserePattern"]).trim() || defaultTodoPattern,
    recentCount: normalizeRecentCount(readCompatibleSetting(config, "recentCount", 8, ["memoRecentCount"])),
    adminOpenOnStartup: readCompatibleSetting(config, "adminOpenOnStartup", false, ["memoAdminOpenOnStartup"]),
    titlePrefix: readCompatibleStringSetting(config, "titlePrefix", defaultQuickMemoTitlePrefix, []),
    dateFormat: readCompatibleStringSetting(config, "dateFormat", defaultQuickMemoDateFormat, []).trim() || defaultQuickMemoDateFormat,
    memoNewFilenameFromClipboard: readCompatibleSetting(config, "memoNewFilenameFromClipboard", false),
    memoNewFilenameFromSelection: readCompatibleSetting(config, "memoNewFilenameFromSelection", false),
    memoNewFilenameDateSuffix: readCompatibleStringSetting(
      config,
      "memoNewFilenameDateSuffix",
      "",
      ["memoNewFilNameDateSuffix"]
    ).trim(),
    locale: readCompatibleSetting(config, "locale", "auto", ["memoDisplayLanguage"]),
    logLevel: readCompatibleSetting(config, "logLevel", defaultLogLevel),
    aiEnabled: readCompatibleSetting(config, "aiEnabled", false),
    ai: readAiSettings(config)
  };
}

function readCompatibleStringSetting(
  config: vscode.WorkspaceConfiguration,
  key: string,
  defaultValue: string,
  aliases: readonly string[]
): string {
  return readCompatibleSetting(config, key, defaultValue, aliases);
}

function readCompatibleSetting<T>(
  config: vscode.WorkspaceConfiguration,
  key: string,
  defaultValue: T,
  aliases: readonly string[] = []
): T {
  const configuredValue = readConfiguredValue<T>(config, key);
  if (configuredValue !== undefined) {
    return configuredValue;
  }

  for (const alias of aliases) {
    const aliasValue = readConfiguredValue<T>(config, alias);
    if (aliasValue !== undefined) {
      return aliasValue;
    }
  }

  return config.get<T>(key, defaultValue);
}

function readConfiguredValue<T>(config: vscode.WorkspaceConfiguration, key: string): T | undefined {
  const inspected = config.inspect<T>(key);
  return inspected?.workspaceFolderValue ?? inspected?.workspaceValue ?? inspected?.globalValue;
}

function normalizeRecentCount(value: number): number {
  return normalizePositiveCount(value, 8);
}

function normalizePositiveCount(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function readListDisplayExtname(value: readonly string[]): readonly string[] {
  const normalized = value
    .map((extension) => extension.trim().replace(/^\./, "").toLowerCase())
    .filter((extension) => extension !== "");

  return normalized.length > 0 ? normalized : [...defaultListDisplayExtname];
}

function readDirectoryNameList(value: readonly string[], fallback: readonly string[]): readonly string[] {
  const normalized = value
    .map((directoryName) => directoryName.trim().replace(/[\\/]+/g, ""))
    .filter((directoryName) => directoryName !== "")
    .map((directoryName) => directoryName.toLowerCase());

  return normalized.length > 0 ? [...new Set(normalized)] : [...fallback];
}

function normalizeScanDepth(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : defaultMaxScanDepth;
}

function readAiSettings(config: vscode.WorkspaceConfiguration) {
  const rawAiSettings = readConfiguredValue<unknown>(config, "ai") ?? config.get<unknown>("ai");
  if (rawAiSettings !== undefined) {
    return normalizeMemoBoxAiSettings(rawAiSettings, defaultAiSettings);
  }

  return buildLegacyMemoBoxAiSettings({
    provider: readConfiguredValue(config, "aiProvider") ?? config.get("aiProvider"),
    endpoint: readConfiguredValue(config, "aiEndpoint") ?? config.get("aiEndpoint"),
    model: readConfiguredValue(config, "aiModel") ?? config.get("aiModel"),
    apiKey: readConfiguredValue(config, "aiApiKey") ?? config.get("aiApiKey"),
    tagLanguage: readConfiguredValue(config, "aiTagLanguage") ?? config.get("aiTagLanguage"),
    proxy: readConfiguredValue(config, "aiProxy") ?? config.get("aiProxy"),
    proxyBypass: readConfiguredValue(config, "aiProxyBypass") ?? config.get("aiProxyBypass"),
    tlsRejectUnauthorized: readConfiguredValue(config, "aiTlsRejectUnauthorized") ?? config.get("aiTlsRejectUnauthorized"),
    tlsCaCert: readConfiguredValue(config, "aiTlsCaCert") ?? config.get("aiTlsCaCert")
  });
}
