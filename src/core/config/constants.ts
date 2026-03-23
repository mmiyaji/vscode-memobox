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
export const defaultLogLevel = "info";
export const defaultAiTimeoutMs = 300_000;
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
      timeoutMs: defaultAiTimeoutMs
    }
  },
  network: {
    proxy: "",
    proxyBypass: "",
    tlsRejectUnauthorized: true,
    tlsCaCert: ""
  }
} as const;
