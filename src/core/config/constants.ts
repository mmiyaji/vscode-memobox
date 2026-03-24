export const extensionId = "mmiyaji.vscode-memobox";
export const configurationSection = "memobox";
export const defaultMetaDir = ".vscode-memobox";
export const defaultDatePathFormat = "yyyy/MM";
export const defaultListSortOrder = "filename";
export const defaultListDisplayExtname = ["md"] as const;
export const defaultGrepViewMode = "quickPick";
export const defaultTodoPattern = "^.*@todo.*?:";
export const defaultQuickMemoTitlePrefix = "## ";
export const defaultQuickMemoDateFormat = "yyyy-MM-dd HH:mm";
export const defaultSearchMaxResults = 200;
export const defaultRelatedMemoLimit = 12;
export const defaultExcludeDirectories = ["node_modules", "dist", "build", "out", "coverage", "vendor"] as const;
export const defaultMaxScanDepth = 4;
export const defaultIndexRefreshCoalesceMs = 1500;
export const defaultIndexFullRescanIntervalMs = 300_000;
export const defaultMemoLinkSuggestDebounceMs = 50;
export const defaultLinkRelatedMemoLimit = 100;
export const defaultGrepConcurrency = 8;
export const defaultLogLevel = "warn";
export const defaultAiTimeoutMs = 300_000;
export const defaultAiRetryDelaysMs = [1000, 3000] as const;
export const defaultAiCostMode = "off";
export const defaultAiPerRequestLimitUsd = 0;
export const defaultAiMonthlyLimitUsd = 0;
export const defaultAiEstimatedOutputTokens = 800;
export const defaultAiSettings = {
  defaultProfile: "local",
  profiles: {
    local: {
      provider: "ollama",
      endpoint: "http://localhost:11434",
      model: "qwen3:1.7b",
      apiKey: "",
      apiKeyEnv: "",
      tagLanguage: "auto",
      timeoutMs: defaultAiTimeoutMs,
      inputCostPer1kUsd: 0,
      outputCostPer1kUsd: 0,
      estimatedOutputTokens: defaultAiEstimatedOutputTokens
    }
  },
  network: {
    proxy: "",
    proxyBypass: "",
    tlsRejectUnauthorized: true,
    tlsCaCert: ""
  }
} as const;
