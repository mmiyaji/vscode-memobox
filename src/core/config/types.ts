export type MemoBoxLocale = "auto" | "ja" | "en";
export type MemoListSortOrder = "filename" | "mtime" | "birthtime";
export type MemoGrepViewMode = "quickPick" | "outputChannel" | "both" | "readOnlyDocument" | "editableDocument";
export type MemoBoxAiProvider = "ollama" | "openai";
export type MemoBoxLogLevel = "off" | "error" | "warn" | "info";
export type MemoBoxAiCostMode = "off" | "estimateOnly" | "confirmHighCost" | "softCap" | "hardCap";

export interface MemoBoxAiProfileSettings {
  readonly provider: MemoBoxAiProvider;
  readonly endpoint: string;
  readonly model: string;
  readonly apiKey: string;
  readonly apiKeyEnv: string;
  readonly tagLanguage: MemoBoxLocale;
  readonly timeoutMs: number;
  readonly inputCostPer1kUsd?: number;
  readonly outputCostPer1kUsd?: number;
  readonly estimatedOutputTokens?: number;
}

export interface MemoBoxAiNetworkSettings {
  readonly proxy: string;
  readonly proxyBypass: string;
  readonly tlsRejectUnauthorized: boolean;
  readonly tlsCaCert: string;
}

export interface MemoBoxAiSettings {
  readonly defaultProfile: string;
  readonly profiles: Readonly<Record<string, MemoBoxAiProfileSettings>>;
  readonly network: MemoBoxAiNetworkSettings;
}

export interface MemoBoxSettings {
  readonly memodir: string;
  readonly datePathFormat: string;
  readonly memotemplate: string;
  readonly metaDir: string;
  readonly templatesDir: string;
  readonly snippetsDir: string;
  readonly searchMaxResults: number;
  readonly relatedMemoLimit: number;
  readonly excludeDirectories: readonly string[];
  readonly maxScanDepth: number;
  readonly listSortOrder: MemoListSortOrder;
  readonly listDisplayExtname: readonly string[];
  readonly displayFileBirthTime: boolean;
  readonly openMarkdownPreview: boolean;
  readonly grepViewMode: MemoGrepViewMode;
  readonly todoPattern: string;
  readonly recentCount: number;
  readonly adminOpenOnStartup: boolean;
  readonly titlePrefix: string;
  readonly dateFormat: string;
  readonly memoNewFilenameFromClipboard: boolean;
  readonly memoNewFilenameFromSelection: boolean;
  readonly memoNewFilenameDateSuffix: string;
  readonly locale: MemoBoxLocale;
  readonly logLevel: MemoBoxLogLevel;
  readonly aiEnabled: boolean;
  readonly aiCostMode?: MemoBoxAiCostMode;
  readonly aiPerRequestLimitUsd?: number;
  readonly aiMonthlyLimitUsd?: number;
  readonly ai: MemoBoxAiSettings;
}
