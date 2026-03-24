import type { MemoBoxLocale } from "../../core/config/types";

export interface MemoCommandLauncherDescriptor {
  readonly group: string;
  readonly command: string;
  readonly label: string;
  readonly detail: string;
  readonly icon: string;
  readonly requiresAi?: boolean;
}

type MemoCommandLauncherLanguage = Extract<MemoBoxLocale, "ja" | "en">;

const localizedCommandLauncherDescriptors: Readonly<Record<MemoCommandLauncherLanguage, readonly MemoCommandLauncherDescriptor[]>> = {
  en: [
    { group: "Daily", command: "memobox.newMemo", label: "New Memo", detail: "Create a new dated memo file from a title and optional template.", icon: "new-file" },
    { group: "Daily", command: "memobox.quickMemo", label: "Quick Memo", detail: "Append a timestamped entry to today's memo.", icon: "note" },
    { group: "Daily", command: "memobox.listMemos", label: "List/Edit", detail: "Browse indexed memo files and open one quickly.", icon: "list-tree" },
    { group: "Daily", command: "memobox.listTags", label: "Browse Tags", detail: "Open memo files grouped by frontmatter tags.", icon: "tag" },
    { group: "Context", command: "memobox.insertMemoLink", label: "Insert Memo Link", detail: "Insert a relative Markdown link to another memo from the active editor.", icon: "link" },
    { group: "Daily", command: "memobox.grepMemos", label: "Grep", detail: "Search across memo files with scoped filtering and previews.", icon: "search" },
    { group: "Daily", command: "memobox.todoMemos", label: "Todo", detail: "Find todo lines across memo files.", icon: "checklist" },
    { group: "Daily", command: "memobox.relatedMemos", label: "Related Memos", detail: "Suggest memo files related to the active memo.", icon: "references" },
    { group: "Context", command: "memobox.redateMemo", label: "Re:Date", detail: "Rename the active memo so its filename uses today's date.", icon: "calendar" },
    { group: "Context", command: "memobox.openMarkdownInBrowser", label: "Open Markdown In Browser", detail: "Render the active markdown file to HTML in your default browser.", icon: "globe" },
    { group: "Maintenance", command: "memobox.refreshIndex", label: "Refresh Index", detail: "Rebuild memo metadata for search, tags, and admin views.", icon: "refresh" },
    { group: "Maintenance", command: "memobox.rebuildIndex", label: "Rebuild Index", detail: "Clear saved index files and rebuild them from the memo root.", icon: "debug-restart" },
    { group: "Maintenance", command: "memobox.clearIndexCache", label: "Clear Index Cache", detail: "Remove saved index files and in-memory cache without touching memo files.", icon: "trash" },
    { group: "Maintenance", command: "memobox.showLogs", label: "Show Logs", detail: "Open the MemoBox output channel for setup, index, and maintenance logs.", icon: "output" },
    { group: "Maintenance", command: "memobox.showAiLogs", label: "Show AI Logs", detail: "Open the MemoBox AI output channel for AI task and configuration logs.", icon: "hubot" },
    { group: "AI", command: "memobox.aiGenerateTitle", label: "AI Generate Title", detail: "Generate title candidates for the active markdown memo.", icon: "sparkle", requiresAi: true },
    { group: "AI", command: "memobox.aiSummarize", label: "AI Summarize", detail: "Write a short memo summary into frontmatter.", icon: "list-flat", requiresAi: true },
    { group: "AI", command: "memobox.aiAutoTag", label: "AI Auto Tag", detail: "Suggest frontmatter tags for the active markdown memo.", icon: "tag", requiresAi: true },
    { group: "AI", command: "memobox.aiProofread", label: "AI Proofread", detail: "Review the active memo for wording and grammar issues.", icon: "wand", requiresAi: true },
    { group: "AI", command: "memobox.aiTranslate", label: "AI Translate", detail: "Translate the active memo or current selection.", icon: "globe", requiresAi: true },
    { group: "AI", command: "memobox.aiQuestion", label: "AI Question", detail: "Ask a question about the active memo and open the answer.", icon: "comment-discussion", requiresAi: true },
    { group: "AI", command: "memobox.aiReport", label: "AI Report", detail: "Generate a markdown report from recent memos in a selected date range.", icon: "graph", requiresAi: true },
    { group: "AI", command: "memobox.aiLinkSuggest", label: "AI Link Suggest", detail: "Suggest related memo links to append to the active document.", icon: "link", requiresAi: true },
    { group: "AI", command: "memobox.aiSuggestTemplate", label: "AI Suggest Template", detail: "Suggest the most suitable template for the active memo.", icon: "library", requiresAi: true },
    { group: "AI", command: "memobox.aiSetApiKey", label: "AI Set API Key", detail: "Store an API key for the active AI profile in VS Code SecretStorage.", icon: "key", requiresAi: true },
    { group: "AI", command: "memobox.aiClearApiKey", label: "AI Clear Stored API Key", detail: "Remove the SecretStorage API key for the active AI profile.", icon: "trash", requiresAi: true },
    { group: "Maintenance", command: "memobox.openMemoFolder", label: "Open Memo Folder", detail: "Open the memo root in a separate VS Code window.", icon: "folder-opened" },
    { group: "Maintenance", command: "memobox.createWorkspace", label: "Create Workspace", detail: "Generate a MemoBox .code-workspace file for the memo root.", icon: "workspace-trusted" },
    { group: "Maintenance", command: "memobox.openAdmin", label: "Open Admin", detail: "Show recent memos, pinned files, tags, templates, and index status.", icon: "dashboard" },
    { group: "Maintenance", command: "memobox.openSetup", label: "Open Setup", detail: "Configure the memo root and optional workspace file.", icon: "tools" },
    { group: "Maintenance", command: "memobox.openSettings", label: "Open Settings", detail: "Open MemoBox settings in the VS Code settings editor.", icon: "gear" }
  ],
  ja: [
    { group: "日常", command: "memobox.newMemo", label: "新規メモ", detail: "タイトルと必要に応じたテンプレートを選んで日付付きメモを作成します。", icon: "new-file" },
    { group: "日常", command: "memobox.quickMemo", label: "今日のクイックメモ", detail: "今日のメモへ時刻付きの追記を追加します。", icon: "note" },
    { group: "日常", command: "memobox.listMemos", label: "一覧 / 編集", detail: "インデックス済みメモを一覧してすばやく開きます。", icon: "list-tree" },
    { group: "日常", command: "memobox.listTags", label: "タグから開く", detail: "frontmatter のタグごとにメモを開きます。", icon: "tag" },
    { group: "文脈", command: "memobox.insertMemoLink", label: "メモリンクを挿入", detail: "アクティブなエディタから別メモへの相対 Markdown リンクを挿入します。", icon: "link" },
    { group: "日常", command: "memobox.grepMemos", label: "検索", detail: "範囲指定とプレビュー付きでメモを横断検索します。", icon: "search" },
    { group: "日常", command: "memobox.todoMemos", label: "Todo", detail: "メモ全体から todo 行を抽出します。", icon: "checklist" },
    { group: "日常", command: "memobox.relatedMemos", label: "関連メモ", detail: "現在のメモに関連する候補を提示します。", icon: "references" },
    { group: "文脈", command: "memobox.redateMemo", label: "日付を今日に変更", detail: "アクティブなメモのファイル名日付を今日に更新します。", icon: "calendar" },
    { group: "文脈", command: "memobox.openMarkdownInBrowser", label: "Markdown をブラウザで開く", detail: "アクティブな Markdown を HTML として既定ブラウザで開きます。", icon: "globe" },
    { group: "メンテナンス", command: "memobox.refreshIndex", label: "インデックスを更新", detail: "検索・タグ・管理画面で使うメタデータを更新します。", icon: "refresh" },
    { group: "メンテナンス", command: "memobox.rebuildIndex", label: "インデックスを再構築", detail: "保存済みインデックスを消してメモルートから作り直します。", icon: "debug-restart" },
    { group: "メンテナンス", command: "memobox.clearIndexCache", label: "インデックスキャッシュを削除", detail: "メモ本体には触れず保存済みインデックスとメモリキャッシュを削除します。", icon: "trash" },
    { group: "メンテナンス", command: "memobox.showLogs", label: "ログを開く", detail: "セットアップ・インデックス・保守用の MemoBox ログを開きます。", icon: "output" },
    { group: "メンテナンス", command: "memobox.showAiLogs", label: "AI ログを開く", detail: "AI タスクと構成状態の MemoBox AI ログを開きます。", icon: "hubot" },
    { group: "AI", command: "memobox.aiGenerateTitle", label: "AI タイトル生成", detail: "アクティブな Markdown メモのタイトル候補を生成します。", icon: "sparkle", requiresAi: true },
    { group: "AI", command: "memobox.aiSummarize", label: "AI 要約", detail: "メモの短い要約を frontmatter に書き込みます。", icon: "list-flat", requiresAi: true },
    { group: "AI", command: "memobox.aiAutoTag", label: "AI タグ提案", detail: "アクティブな Markdown メモの frontmatter タグ候補を生成します。", icon: "tag", requiresAi: true },
    { group: "AI", command: "memobox.aiProofread", label: "AI 校正", detail: "アクティブなメモの表現や文法を見直します。", icon: "wand", requiresAi: true },
    { group: "AI", command: "memobox.aiTranslate", label: "AI 翻訳", detail: "アクティブなメモまたは選択範囲を翻訳します。", icon: "globe", requiresAi: true },
    { group: "AI", command: "memobox.aiQuestion", label: "AI 質問", detail: "アクティブなメモについて質問し、回答を開きます。", icon: "comment-discussion", requiresAi: true },
    { group: "AI", command: "memobox.aiReport", label: "AI レポート", detail: "指定期間の最近のメモから Markdown レポートを生成します。", icon: "graph", requiresAi: true },
    { group: "AI", command: "memobox.aiLinkSuggest", label: "AI リンク提案", detail: "アクティブな文書へ追記する関連メモリンクを提案します。", icon: "link", requiresAi: true },
    { group: "AI", command: "memobox.aiSuggestTemplate", label: "AI テンプレート提案", detail: "アクティブなメモに合うテンプレートを提案します。", icon: "library", requiresAi: true },
    { group: "AI", command: "memobox.aiSetApiKey", label: "AI API キーを保存", detail: "有効な AI profile 用 API キーを VS Code SecretStorage に保存します。", icon: "key", requiresAi: true },
    { group: "AI", command: "memobox.aiClearApiKey", label: "保存済み AI API キーを削除", detail: "有効な AI profile の SecretStorage API キーを削除します。", icon: "trash", requiresAi: true },
    { group: "メンテナンス", command: "memobox.openMemoFolder", label: "メモフォルダを開く", detail: "メモルートを別の VS Code ウィンドウで開きます。", icon: "folder-opened" },
    { group: "メンテナンス", command: "memobox.createWorkspace", label: "ワークスペースを作成", detail: "メモルート用の MemoBox .code-workspace を生成します。", icon: "workspace-trusted" },
    { group: "メンテナンス", command: "memobox.openAdmin", label: "管理画面を開く", detail: "Recent、Pinned、タグ、テンプレート、インデックス状態を表示します。", icon: "dashboard" },
    { group: "メンテナンス", command: "memobox.openSetup", label: "Setup を開く", detail: "MemoBox の初期セットアップと修復フローを開きます。", icon: "tools" },
    { group: "メンテナンス", command: "memobox.openSettings", label: "設定を開く", detail: "VS Code の MemoBox 設定を開きます。", icon: "gear" }
  ]
};

export function getMemoCommandLauncherDescriptors(options: {
  readonly aiEnabled?: boolean;
  readonly language?: MemoCommandLauncherLanguage;
} = {}): readonly MemoCommandLauncherDescriptor[] {
  const language = options.language ?? "en";
  return localizedCommandLauncherDescriptors[language].filter((descriptor) => !descriptor.requiresAi || options.aiEnabled === true);
}
