/* eslint-disable no-unused-vars */
import * as vscode from "vscode";
import type { MemoRootRiskCode } from "../core/memo/memoRootGuard";
import type { MemoBoxLocale } from "../core/config/types";

export type MemoBoxUiLanguage = "ja" | "en";

export interface MemoBoxUiText {
  formatMemoRootRisk(_riskCode: MemoRootRiskCode): string;
  readonly admin: {
    readonly pageTitle: string;
    panelTitle(_version: string): string;
    readonly overviewTitle: string;
    readonly overviewCopy: string;
    readonly lastRefreshedLabel: string;
    readonly dataSourceLabel: string;
    readonly scopeLabel: string;
    readonly noIndexedFiles: string;
    readonly noPinnedFiles: string;
    readonly actionGroupDaily: string;
    readonly actionGroupMaintenance: string;
    readonly actionNewMemo: string;
    readonly actionQuickMemo: string;
    readonly actionListMemos: string;
    readonly actionTags: string;
    readonly actionGrep: string;
    readonly actionTodo: string;
    readonly actionOpenFolder: string;
    readonly actionRefreshIndex: string;
    readonly actionRebuildIndex: string;
    readonly actionClearIndexCache: string;
    readonly actionShowLogs: string;
    readonly actionShowAiLogs: string;
    readonly actionCreateWorkspace: string;
    readonly actionOpenSetup: string;
    readonly actionSetAiApiKey: string;
    readonly actionClearAiApiKey: string;
    readonly actionReloadAdmin: string;
    readonly actionSettings: string;
    readonly warningTitle: string;
    readonly warningCopy: string;
    readonly warningBroadRootTitle: string;
    readonly warningBroadRootCopy: string;
    warningBroadRootReasons(_reasons: string): string;
    warningBroadRootRecommendation(_path: string): string;
    readonly warningUseRecommendedPath: string;
    readonly warningOpenSetup: string;
    readonly summaryMemoRoot: string;
    readonly summaryMemoRootReady: string;
    readonly summaryMemoRootNeedsSetup: string;
    readonly summaryIndexedMemos: string;
    summaryLatestUpdate(_value: string): string;
    readonly summaryMemoIndex: string;
    readonly summaryAvailable: string;
    readonly summaryNotCreated: string;
    readonly summaryMaintenance: string;
    readonly summaryHealthy: string;
    summaryIssues(_count: number): string;
    readonly summaryAi: string;
    readonly summaryAiOff: string;
    readonly summaryAiConfigured: string;
    readonly summaryAiNeedsSetup: string;
    readonly summaryAiDisabledDetail: string;
    readonly summaryAiNeedsSetupDetail: string;
    summaryAiKey(_label: string): string;
    readonly summaryAiKeySettings: string;
    readonly summaryAiKeySecretStorage: string;
    readonly summaryAiKeyEnvironment: string;
    readonly summaryAiKeyMissing: string;
    readonly summaryAiKeyNotRequired: string;
    readonly recentMemosTitle: string;
    readonly recentMemosSubtitle: string;
    readonly recentMemosMeta: string;
    readonly pinnedMemosTitle: string;
    readonly pinnedMemosSubtitle: string;
    readonly folderSummaryTitle: string;
    readonly folderSummarySubtitle: string;
    readonly folderSummaryMeta: string;
    readonly folderSummaryEmpty: string;
    readonly tagsTitle: string;
    readonly tagsSubtitle: string;
    readonly tagsMeta: string;
    readonly tagsEmpty: string;
    readonly workspaceStatusTitle: string;
    readonly workspaceStatusSubtitle: string;
    readonly kvMemoRoot: string;
    readonly kvTodayDirectory: string;
    readonly kvTodayMemoPath: string;
    readonly kvDefaultTemplate: string;
    readonly kvWorkspaceFile: string;
    readonly kvAdminOpenOnStartup: string;
    readonly kvConfiguration: string;
    readonly optionEnabled: string;
    readonly optionDisabled: string;
    readonly maintenanceAssetsTitle: string;
    readonly maintenanceAssetsSubtitle: string;
    readonly templatesTitle: string;
    readonly templatesSubtitle: string;
    readonly snippetsTitle: string;
    readonly snippetsSubtitle: string;
    readonly labelDirectory: string;
    readonly ensureDirs: string;
    readonly reveal: string;
    readonly templatesDirectoryReady: string;
    readonly templatesDirectoryMissing: string;
    readonly snippetsDirectoryReady: string;
    readonly snippetsDirectoryMissing: string;
    readonly templatesDirectoryNotReady: string;
    readonly snippetsDirectoryNotReady: string;
    readonly noTemplateFiles: string;
    readonly noSnippetFiles: string;
    readonly clearExplicitDefault: string;
    readonly open: string;
    readonly setDefault: string;
    readonly defaultTemplate: string;
    readonly availableTemplate: string;
    readonly noSnippetEntries: string;
    failedToLoad(_message: string): string;
    readonly maintenanceTemplatesReady: string;
    readonly maintenanceTemplatesMissing: string;
    readonly maintenanceSnippetsReady: string;
    readonly maintenanceSnippetsMissing: string;
    readonly maintenanceSnippetLoadErrors: string;
    readonly created: string;
    readonly notCreated: string;
    readonly notAvailable: string;
    readonly pin: string;
    readonly unpin: string;
    files(_count: number): string;
    memos(_count: number): string;
    templateFiles(_count: number): string;
    snippetFiles(_count: number): string;
    snippets(_count: number): string;
    readonly errorFileUnavailable: string;
    readonly errorRevealFailed: string;
    readonly errorSetMemoDirBeforeScaffold: string;
  };
  readonly setup: {
    readonly pageTitle: string;
    panelTitle(_version: string): string;
    readonly title: string;
    readonly heroCopy: string;
    readonly stepMemoRoot: string;
    readonly stepWorkspace: string;
    readonly stepReady: string;
    readonly memoRootHeadingChoose: string;
    readonly memoRootHeadingFinish: string;
    readonly memoRootCopyChoose: string;
    readonly memoRootCopyFinish: string;
    readonly useSuggestedFolder: string;
    readonly createThisFolder: string;
    readonly chooseFolder: string;
    readonly openSettings: string;
    readonly broadRootWarningTitle: string;
    readonly broadRootWarningCopy: string;
    broadRootReasons(_reasons: string): string;
    broadRootRecommendation(_path: string): string;
    readonly useRecommendedPath: string;
    readonly broadRootConfirmTitle: string;
    broadRootConfirmDetail(_path: string): string;
    readonly broadRootConfirmAction: string;
    readonly suggestedPath: string;
    readonly configuredPath: string;
    readonly storedAs: string;
    readonly storedAsGlobal: string;
    readonly createdFolders: string;
    readonly workspaceHeading: string;
    readonly workspaceCopy: string;
    readonly createWorkspaceFile: string;
    readonly openMemoFolder: string;
    readonly skipForNow: string;
    readonly workspaceFile: string;
    readonly includedSettings: string;
    readonly recommendations: string;
    readonly readyHeading: string;
    readonly readyCopy: string;
    readonly createFirstMemo: string;
    readonly openAdmin: string;
    readonly openWorkspace: string;
    readonly readyMemoRoot: string;
    readonly readyNext: string;
    readonly readyNextCopy: string;
    readonly notCreated: string;
    memoRootReadyMessage(_path: string): string;
    readonly workspaceOpenFailed: string;
  };
}

export function resolveUiLanguage(setting: MemoBoxLocale): MemoBoxUiLanguage {
  if (setting === "ja" || setting === "en") {
    return setting;
  }

  return vscode.env.language.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function getMemoBoxUiText(language: MemoBoxUiLanguage): MemoBoxUiText {
  return language === "ja" ? japaneseText : englishText;
}

const englishText: MemoBoxUiText = {
  formatMemoRootRisk: (riskCode) => {
    switch (riskCode) {
      case "filesystemRoot":
        return "Drive root";
      case "home":
        return "Home";
      case "documents":
        return "Documents";
      case "desktop":
        return "Desktop";
      case "downloads":
        return "Downloads";
      default:
        return riskCode;
    }
  },
  admin: {
    pageTitle: "MemoBox",
    panelTitle: (version) => `MemoBox ${version}`,
    overviewTitle: "Memo Overview",
    overviewCopy: "Review memo availability, recent changes, and maintenance status before jumping into the next action.",
    lastRefreshedLabel: "Last refreshed",
    dataSourceLabel: "Data source",
    scopeLabel: "Scope",
    noIndexedFiles: "No memo files are indexed yet.",
    noPinnedFiles: "Pin frequently used memo files from Recent Memos.",
    actionGroupDaily: "Daily",
    actionGroupMaintenance: "Maintenance",
    actionNewMemo: "New Memo",
    actionQuickMemo: "Quick Memo",
    actionListMemos: "List/Edit",
    actionTags: "Tags",
    actionGrep: "Grep",
    actionTodo: "Todo",
    actionOpenFolder: "Open Folder",
    actionRefreshIndex: "Refresh Index",
    actionRebuildIndex: "Rebuild Index",
    actionClearIndexCache: "Clear Index Cache",
    actionShowLogs: "Show Logs",
    actionShowAiLogs: "Show AI Logs",
    actionCreateWorkspace: "Create Workspace",
    actionOpenSetup: "Open Setup",
    actionSetAiApiKey: "Set AI API Key",
    actionClearAiApiKey: "Clear Stored AI API Key",
    actionReloadAdmin: "Reload Admin",
    actionSettings: "Settings",
    warningTitle: "Memo root is not ready",
    warningCopy: "Memo commands need a valid memobox.memodir. Open Setup to repair the memo root configuration.",
    warningBroadRootTitle: "Memo root may be too broad",
    warningBroadRootCopy: "The configured memo root points to a high-level folder. Prefer a dedicated child folder to avoid scanning unrelated files.",
    warningBroadRootReasons: (reasons) => `Reasons: ${reasons}`,
    warningBroadRootRecommendation: (path) => `Recommended: ${path}`,
    warningUseRecommendedPath: "Use Recommended Path",
    warningOpenSetup: "Open Setup",
    summaryMemoRoot: "Memo Root",
    summaryMemoRootReady: "Ready",
    summaryMemoRootNeedsSetup: "Needs setup",
    summaryIndexedMemos: "Indexed Memos",
    summaryLatestUpdate: (value) => `Latest update: ${value}`,
    summaryMemoIndex: "Memo Index",
    summaryAvailable: "Available",
    summaryNotCreated: "Not created",
    summaryMaintenance: "Maintenance",
    summaryHealthy: "Healthy",
    summaryIssues: (count) => `${count} issue${count === 1 ? "" : "s"}`,
    summaryAi: "AI",
    summaryAiOff: "Off",
    summaryAiConfigured: "Configured",
    summaryAiNeedsSetup: "Needs setup",
    summaryAiDisabledDetail: "Disabled in settings.",
    summaryAiNeedsSetupDetail: "AI configuration needs attention.",
    summaryAiKey: (label) => `API key: ${label}`,
    summaryAiKeySettings: "Settings JSON",
    summaryAiKeySecretStorage: "SecretStorage",
    summaryAiKeyEnvironment: "Environment",
    summaryAiKeyMissing: "Missing",
    summaryAiKeyNotRequired: "Not required",
    recentMemosTitle: "Recent Memos",
    recentMemosSubtitle: "Latest updated memo files from the current index.",
    recentMemosMeta: "Sorted by updated time. Open a file or pin it for repeated access.",
    pinnedMemosTitle: "Pinned Memos",
    pinnedMemosSubtitle: "Stable shortcuts for memo files you reopen often.",
    folderSummaryTitle: "Folder Summary",
    folderSummarySubtitle: "Top folders by indexed memo count.",
    folderSummaryMeta: "Counts are shown directly to avoid misleading visual scaling.",
    folderSummaryEmpty: "Folder summary appears here after memo files are created.",
    tagsTitle: "Tags",
    tagsSubtitle: "Frontmatter tags aggregated from the current memo index.",
    tagsMeta: "Use tags to jump into grouped memo files without a free-text search.",
    tagsEmpty: "Tags appear here when memo frontmatter includes tags.",
    workspaceStatusTitle: "Workspace Status",
    workspaceStatusSubtitle: "Current paths and defaults used by memo commands.",
    kvMemoRoot: "Memo Root",
    kvTodayDirectory: "Today Directory",
    kvTodayMemoPath: "Today Memo Path",
    kvDefaultTemplate: "Default Template",
    kvWorkspaceFile: "Workspace File",
    kvAdminOpenOnStartup: "Open Admin On Startup",
    kvConfiguration: "Configuration",
    optionEnabled: "Enabled",
    optionDisabled: "Disabled",
    maintenanceAssetsTitle: "Maintenance Assets",
    maintenanceAssetsSubtitle: "Template and snippet files used by memo creation and completion.",
    templatesTitle: "Templates",
    templatesSubtitle: "Markdown files used by New Memo.",
    snippetsTitle: "Snippets",
    snippetsSubtitle: "JSON files used for Markdown completion.",
    labelDirectory: "Directory",
    ensureDirs: "Ensure Dirs",
    reveal: "Reveal",
    templatesDirectoryReady: "Ready",
    templatesDirectoryMissing: "Missing",
    snippetsDirectoryReady: "Ready",
    snippetsDirectoryMissing: "Missing",
    templatesDirectoryNotReady: "Templates directory is not ready yet.",
    snippetsDirectoryNotReady: "Snippets directory is not ready yet.",
    noTemplateFiles: "No template files found. Place .md files in the templates directory.",
    noSnippetFiles: "No snippet files found. Place VS Code snippet JSON files in the snippets directory.",
    clearExplicitDefault: "Clear Explicit Default",
    open: "Open",
    setDefault: "Set Default",
    defaultTemplate: "Default template",
    availableTemplate: "Available template",
    noSnippetEntries: "No snippet entries found.",
    failedToLoad: (message) => `Failed to load: ${message}`,
    maintenanceTemplatesReady: "Templates ready",
    maintenanceTemplatesMissing: "Templates directory missing",
    maintenanceSnippetsReady: "Snippets ready",
    maintenanceSnippetsMissing: "Snippets directory missing",
    maintenanceSnippetLoadErrors: "Snippet load errors detected",
    created: "Created",
    notCreated: "Not created",
    notAvailable: "n/a",
    pin: "Pin",
    unpin: "Unpin",
    files: (count) => `${count} file${count === 1 ? "" : "s"}`,
    memos: (count) => `${count} memo${count === 1 ? "" : "s"}`,
    templateFiles: (count) => `${count} template file${count === 1 ? "" : "s"}`,
    snippetFiles: (count) => `${count} snippet file${count === 1 ? "" : "s"}`,
    snippets: (count) => `${count} snippet${count === 1 ? "" : "s"}`,
    errorFileUnavailable: "MemoBox: The selected memo file is no longer available.",
    errorRevealFailed: "MemoBox: Failed to reveal the selected path.",
    errorSetMemoDirBeforeScaffold: "MemoBox: Set memobox.memodir before creating template and snippet directories."
  },
  setup: {
    pageTitle: "MemoBox Setup",
    panelTitle: (version) => `MemoBox Setup ${version}`,
    title: "Setup MemoBox",
    heroCopy: "Use a dedicated first-run flow for your global memo root, then optionally create a workspace file for VS Code.",
    stepMemoRoot: "1. Memo Root",
    stepWorkspace: "2. Workspace",
    stepReady: "3. Ready",
    memoRootHeadingChoose: "Choose Memo Root",
    memoRootHeadingFinish: "Finish Memo Root Setup",
    memoRootCopyChoose: "MemoBox stores daily notes under one memo root. This is saved globally so it follows you across workspaces.",
    memoRootCopyFinish: "The configured memo root is missing or incomplete. Create it now or choose another folder.",
    useSuggestedFolder: "Use Suggested Folder",
    createThisFolder: "Create This Folder",
    chooseFolder: "Choose Folder",
    openSettings: "Open Settings",
    broadRootWarningTitle: "This path looks broader than a typical memo root",
    broadRootWarningCopy: "Prefer a dedicated child folder such as Documents/MemoBox to reduce accidental scanning of unrelated files.",
    broadRootReasons: (reasons) => `Reasons: ${reasons}`,
    broadRootRecommendation: (path) => `Recommended: ${path}`,
    useRecommendedPath: "Use Recommended Path",
    broadRootConfirmTitle: "The selected memo root looks too broad.",
    broadRootConfirmDetail: (path) => `The selected path is ${path}. This may scan unrelated files. Use a dedicated child folder if possible.`,
    broadRootConfirmAction: "Use Anyway",
    suggestedPath: "Suggested Path",
    configuredPath: "Configured Path",
    storedAs: "Stored As",
    storedAsGlobal: "Global setting: memobox.memodir",
    createdFolders: "Created Folders",
    workspaceHeading: "Create Workspace File",
    workspaceCopy: "Memo root is ready. If you want a dedicated VS Code workspace, generate a .code-workspace file as the next step.",
    createWorkspaceFile: "Create Workspace File",
    openMemoFolder: "Open Memo Folder",
    skipForNow: "Skip For Now",
    workspaceFile: "Workspace File",
    includedSettings: "Included Settings",
    recommendations: "Recommendations",
    readyHeading: "Ready To Start",
    readyCopy: "Setup is complete. Start writing immediately or move to the Admin dashboard.",
    createFirstMemo: "Create First Memo",
    openAdmin: "Open Admin",
    openWorkspace: "Open Workspace",
    readyMemoRoot: "Memo Root",
    readyNext: "Next",
    readyNextCopy: "Use Admin for recent files, tags, templates, snippets, and index maintenance.",
    notCreated: "Not created",
    memoRootReadyMessage: (path) => `MemoBox: Memo root is ready at ${path}.`,
    workspaceOpenFailed: "MemoBox: Failed to open the generated workspace file."
  }
};

const japaneseText: MemoBoxUiText = {
  formatMemoRootRisk: (riskCode) => {
    switch (riskCode) {
      case "filesystemRoot":
        return "ドライブ直下";
      case "home":
        return "ホーム";
      case "documents":
        return "Documents";
      case "desktop":
        return "Desktop";
      case "downloads":
        return "Downloads";
      default:
        return riskCode;
    }
  },
  admin: {
    pageTitle: "MemoBox",
    panelTitle: (version) => `MemoBox 管理画面 ${version}`,
    overviewTitle: "メモの概要",
    overviewCopy: "次の操作に進む前に、メモの利用状況、最近の更新、保守状態を確認します。",
    lastRefreshedLabel: "最終更新",
    dataSourceLabel: "データ元",
    scopeLabel: "対象",
    noIndexedFiles: "まだインデックス済みのメモはありません。",
    noPinnedFiles: "最近のメモからよく使うメモをピン留めしてください。",
    actionGroupDaily: "日常操作",
    actionGroupMaintenance: "メンテナンス",
    actionNewMemo: "新規メモ",
    actionQuickMemo: "クイックメモ",
    actionListMemos: "一覧 / 編集",
    actionTags: "タグ",
    actionGrep: "検索",
    actionTodo: "Todo",
    actionOpenFolder: "フォルダを開く",
    actionRefreshIndex: "インデックス更新",
    actionRebuildIndex: "インデックス再構築",
    actionClearIndexCache: "インデックスキャッシュ削除",
    actionShowLogs: "ログを開く",
    actionShowAiLogs: "AI ログを開く",
    actionCreateWorkspace: "ワークスペース作成",
    actionOpenSetup: "Setup を開く",
    actionSetAiApiKey: "AI API キーを保存",
    actionClearAiApiKey: "保存済み AI API キーを削除",
    actionReloadAdmin: "管理画面を再読み込み",
    actionSettings: "設定",
    warningTitle: "メモルートが未設定です",
    warningCopy: "MemoBox のコマンドを使うには有効な memobox.memodir が必要です。設定を修復するには Setup を開いてください。",
    warningBroadRootTitle: "メモルートが広すぎる可能性があります",
    warningBroadRootCopy: "上位フォルダが指定されているため、無関係なファイルまで走査する可能性があります。専用の子フォルダを推奨します。",
    warningBroadRootReasons: (reasons) => `判定理由: ${reasons}`,
    warningBroadRootRecommendation: (path) => `推奨パス: ${path}`,
    warningUseRecommendedPath: "推奨パスを使う",
    warningOpenSetup: "Setup を開く",
    summaryMemoRoot: "メモルート",
    summaryMemoRootReady: "準備完了",
    summaryMemoRootNeedsSetup: "設定が必要",
    summaryIndexedMemos: "インデックス済みメモ",
    summaryLatestUpdate: (value) => `最新更新: ${value}`,
    summaryMemoIndex: "メモインデックス",
    summaryAvailable: "利用可能",
    summaryNotCreated: "未作成",
    summaryMaintenance: "メンテナンス",
    summaryHealthy: "正常",
    summaryIssues: (count) => `${count} 件の問題`,
    summaryAi: "AI",
    summaryAiOff: "オフ",
    summaryAiConfigured: "設定済み",
    summaryAiNeedsSetup: "設定要確認",
    summaryAiDisabledDetail: "設定で無効です。",
    summaryAiNeedsSetupDetail: "AI の設定を確認してください。",
    summaryAiKey: (label) => `API キー: ${label}`,
    summaryAiKeySettings: "設定 JSON",
    summaryAiKeySecretStorage: "SecretStorage",
    summaryAiKeyEnvironment: "環境変数",
    summaryAiKeyMissing: "未設定",
    summaryAiKeyNotRequired: "不要",
    recentMemosTitle: "最近のメモ",
    recentMemosSubtitle: "現在のインデックスから、更新日時が新しいメモを表示します。",
    recentMemosMeta: "更新日時順に並びます。ファイルを開いたり、ピン留めして再利用できます。",
    pinnedMemosTitle: "ピン留めメモ",
    pinnedMemosSubtitle: "繰り返し開くメモへの固定ショートカットです。",
    folderSummaryTitle: "フォルダ集計",
    folderSummarySubtitle: "インデックス済みメモ数が多いフォルダを表示します。",
    folderSummaryMeta: "誤解を招くグラフ表現を避け、件数をそのまま表示します。",
    folderSummaryEmpty: "メモを作成すると、ここにフォルダ集計が表示されます。",
    tagsTitle: "タグ",
    tagsSubtitle: "現在のメモインデックスから frontmatter の tags を集計します。",
    tagsMeta: "フリーテキスト検索をせずに、タグ単位でメモへ移動できます。",
    tagsEmpty: "frontmatter に tags が含まれるメモがあると、ここに表示されます。",
    workspaceStatusTitle: "ワークスペース状態",
    workspaceStatusSubtitle: "メモコマンドが参照している現在のパスと既定値です。",
    kvMemoRoot: "メモルート",
    kvTodayDirectory: "今日のディレクトリ",
    kvTodayMemoPath: "今日のメモパス",
    kvDefaultTemplate: "既定テンプレート",
    kvWorkspaceFile: "ワークスペースファイル",
    kvAdminOpenOnStartup: "起動時に管理画面を表示",
    kvConfiguration: "設定",
    optionEnabled: "有効",
    optionDisabled: "無効",
    maintenanceAssetsTitle: "保守用アセット",
    maintenanceAssetsSubtitle: "メモ作成と補完で使うテンプレートとスニペットです。",
    templatesTitle: "テンプレート",
    templatesSubtitle: "New Memo で使う Markdown ファイルです。",
    snippetsTitle: "スニペット",
    snippetsSubtitle: "Markdown 補完で使う JSON ファイルです。",
    labelDirectory: "ディレクトリ",
    ensureDirs: "必要なディレクトリを作成",
    reveal: "表示",
    templatesDirectoryReady: "利用可能",
    templatesDirectoryMissing: "未作成",
    snippetsDirectoryReady: "利用可能",
    snippetsDirectoryMissing: "未作成",
    templatesDirectoryNotReady: "テンプレートディレクトリはまだ準備されていません。",
    snippetsDirectoryNotReady: "スニペットディレクトリはまだ準備されていません。",
    noTemplateFiles: "テンプレートファイルがありません。templates ディレクトリに .md ファイルを置いてください。",
    noSnippetFiles: "スニペットファイルがありません。snippets ディレクトリに VS Code snippet JSON を置いてください。",
    clearExplicitDefault: "明示的な既定を解除",
    open: "開く",
    setDefault: "既定にする",
    defaultTemplate: "既定テンプレート",
    availableTemplate: "利用可能テンプレート",
    noSnippetEntries: "スニペット項目はありません。",
    failedToLoad: (message) => `読み込み失敗: ${message}`,
    maintenanceTemplatesReady: "テンプレート利用可能",
    maintenanceTemplatesMissing: "テンプレートディレクトリ未作成",
    maintenanceSnippetsReady: "スニペット利用可能",
    maintenanceSnippetsMissing: "スニペットディレクトリ未作成",
    maintenanceSnippetLoadErrors: "スニペット読み込みエラーあり",
    created: "作成済み",
    notCreated: "未作成",
    notAvailable: "該当なし",
    pin: "ピン留め",
    unpin: "解除",
    files: (count) => `${count} ファイル`,
    memos: (count) => `${count} 件`,
    templateFiles: (count) => `${count} 個のテンプレート`,
    snippetFiles: (count) => `${count} 個のスニペットファイル`,
    snippets: (count) => `${count} 個のスニペット`,
    errorFileUnavailable: "MemoBox: 選択したメモファイルは見つかりません。",
    errorRevealFailed: "MemoBox: 選択したパスを表示できませんでした。",
    errorSetMemoDirBeforeScaffold: "MemoBox: テンプレートとスニペットを作成する前に memobox.memodir を設定してください。"
  },
  setup: {
    pageTitle: "MemoBox 初期設定",
    panelTitle: (version) => `MemoBox 初期設定 ${version}`,
    title: "MemoBox 初期設定",
    heroCopy: "まずグローバルなメモルートを設定し、その後必要なら VS Code 用ワークスペースファイルを作成します。",
    stepMemoRoot: "1. メモルート",
    stepWorkspace: "2. ワークスペース",
    stepReady: "3. 利用開始",
    memoRootHeadingChoose: "メモルートを選択",
    memoRootHeadingFinish: "メモルート設定を完了",
    memoRootCopyChoose: "MemoBox は日々のメモを 1 つのメモルート配下に保存します。この設定はグローバルに保存され、ワークスペースをまたいで利用されます。",
    memoRootCopyFinish: "設定済みのメモルートが見つからないか、不完全です。今すぐ作成するか、別のフォルダを選択してください。",
    useSuggestedFolder: "推奨フォルダを使う",
    createThisFolder: "このフォルダを作成",
    chooseFolder: "フォルダを選ぶ",
    openSettings: "設定を開く",
    broadRootWarningTitle: "このパスはメモルートとして広すぎる可能性があります",
    broadRootWarningCopy: "Documents/MemoBox のような専用の子フォルダを使うと、無関係なファイルの走査を避けやすくなります。",
    broadRootReasons: (reasons) => `判定理由: ${reasons}`,
    broadRootRecommendation: (path) => `推奨パス: ${path}`,
    useRecommendedPath: "推奨パスを使う",
    broadRootConfirmTitle: "選択したメモルートは広すぎる可能性があります。",
    broadRootConfirmDetail: (path) => `選択したパスは ${path} です。無関係なファイルまで走査する可能性があります。可能なら専用の子フォルダを使ってください。`,
    broadRootConfirmAction: "このまま使う",
    suggestedPath: "推奨パス",
    configuredPath: "設定済みパス",
    storedAs: "保存先",
    storedAsGlobal: "グローバル設定: memobox.memodir",
    createdFolders: "作成されるフォルダ",
    workspaceHeading: "ワークスペースファイルを作成",
    workspaceCopy: "メモルートは準備できました。専用の VS Code ワークスペースが必要なら、次に .code-workspace ファイルを生成してください。",
    createWorkspaceFile: "ワークスペースファイルを作成",
    openMemoFolder: "メモフォルダを開く",
    skipForNow: "今回はスキップ",
    workspaceFile: "ワークスペースファイル",
    includedSettings: "含まれる設定",
    recommendations: "推奨拡張",
    readyHeading: "利用開始できます",
    readyCopy: "初期設定は完了です。すぐにメモを書き始めるか、管理画面へ移動してください。",
    createFirstMemo: "最初のメモを作成",
    openAdmin: "管理画面を開く",
    openWorkspace: "ワークスペースを開く",
    readyMemoRoot: "メモルート",
    readyNext: "次の操作",
    readyNextCopy: "Recent files、タグ、テンプレート、スニペット、インデックス保守は Admin から行えます。",
    notCreated: "未作成",
    memoRootReadyMessage: (path) => `MemoBox: メモルートの準備ができました: ${path}`,
    workspaceOpenFailed: "MemoBox: 生成したワークスペースファイルを開けませんでした。"
  }
};
