export interface MemoCommandLauncherDescriptor {
  readonly group: "Daily" | "Context" | "Maintenance" | "AI";
  readonly command: string;
  readonly label: string;
  readonly detail: string;
  readonly icon: string;
  readonly requiresAi?: boolean;
}

const memoCommandLauncherDescriptors: readonly MemoCommandLauncherDescriptor[] = [
  {
    group: "Daily",
    command: "memobox.newMemo",
    label: "New Memo",
    detail: "Create a new dated memo file from a title and optional template.",
    icon: "new-file"
  },
  {
    group: "Daily",
    command: "memobox.quickMemo",
    label: "Quick Memo",
    detail: "Append a timestamped entry to today's memo.",
    icon: "note"
  },
  {
    group: "Daily",
    command: "memobox.listMemos",
    label: "List/Edit",
    detail: "Browse indexed memo files and open one quickly.",
    icon: "list-tree"
  },
  {
    group: "Daily",
    command: "memobox.listTags",
    label: "Browse Tags",
    detail: "Open memo files grouped by frontmatter tags.",
    icon: "tag"
  },
  {
    group: "Daily",
    command: "memobox.grepMemos",
    label: "Grep",
    detail: "Search across memo files with scoped filtering and previews.",
    icon: "search"
  },
  {
    group: "Daily",
    command: "memobox.todoMemos",
    label: "Todo",
    detail: "Find todo lines across memo files.",
    icon: "checklist"
  },
  {
    group: "Daily",
    command: "memobox.relatedMemos",
    label: "Related Memos",
    detail: "Suggest memo files related to the active memo.",
    icon: "references"
  },
  {
    group: "Context",
    command: "memobox.redateMemo",
    label: "Re:Date",
    detail: "Rename the active memo so its filename uses today's date.",
    icon: "calendar"
  },
  {
    group: "Context",
    command: "memobox.openMarkdownInBrowser",
    label: "Open Markdown In Browser",
    detail: "Render the active markdown file to HTML in your default browser.",
    icon: "globe"
  },
  {
    group: "Maintenance",
    command: "memobox.refreshIndex",
    label: "Refresh Index",
    detail: "Rebuild memo metadata for search, tags, and admin views.",
    icon: "refresh"
  },
  {
    group: "Maintenance",
    command: "memobox.rebuildIndex",
    label: "Rebuild Index",
    detail: "Clear saved index files and rebuild them from the memo root.",
    icon: "debug-restart"
  },
  {
    group: "Maintenance",
    command: "memobox.clearIndexCache",
    label: "Clear Index Cache",
    detail: "Remove saved index files and in-memory cache without touching memo files.",
    icon: "trash"
  },
  {
    group: "AI",
    command: "memobox.aiGenerateTitle",
    label: "AI Generate Title",
    detail: "Generate title candidates for the active markdown memo.",
    icon: "sparkle",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiSummarize",
    label: "AI Summarize",
    detail: "Write a short memo summary into frontmatter.",
    icon: "list-flat",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiAutoTag",
    label: "AI Auto Tag",
    detail: "Suggest frontmatter tags for the active markdown memo.",
    icon: "tag",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiProofread",
    label: "AI Proofread",
    detail: "Review the active memo for wording and grammar issues.",
    icon: "wand",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiTranslate",
    label: "AI Translate",
    detail: "Translate the active memo or current selection.",
    icon: "globe",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiQuestion",
    label: "AI Question",
    detail: "Ask a question about the active memo and open the answer.",
    icon: "comment-discussion",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiReport",
    label: "AI Report",
    detail: "Generate a markdown report from recent memos in a selected date range.",
    icon: "graph",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiLinkSuggest",
    label: "AI Link Suggest",
    detail: "Suggest related memo links to append to the active document.",
    icon: "link",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiSuggestTemplate",
    label: "AI Suggest Template",
    detail: "Suggest the most suitable template for the active memo.",
    icon: "library",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiSetApiKey",
    label: "AI Set API Key",
    detail: "Store an API key for the active AI profile in VS Code SecretStorage.",
    icon: "key",
    requiresAi: true
  },
  {
    group: "AI",
    command: "memobox.aiClearApiKey",
    label: "AI Clear Stored API Key",
    detail: "Remove the SecretStorage API key for the active AI profile.",
    icon: "trash",
    requiresAi: true
  },
  {
    group: "Maintenance",
    command: "memobox.openMemoFolder",
    label: "Open Memo Folder",
    detail: "Open the memo root in a separate VS Code window.",
    icon: "folder-opened"
  },
  {
    group: "Maintenance",
    command: "memobox.createWorkspace",
    label: "Create Workspace",
    detail: "Generate a MemoBox .code-workspace file for the memo root.",
    icon: "workspace-trusted"
  },
  {
    group: "Maintenance",
    command: "memobox.openAdmin",
    label: "Open Admin",
    detail: "Show recent memos, pinned files, tags, templates, and index status.",
    icon: "dashboard"
  },
  {
    group: "Maintenance",
    command: "memobox.openSetup",
    label: "Open Setup",
    detail: "Configure the memo root and optional workspace file.",
    icon: "tools"
  },
  {
    group: "Maintenance",
    command: "memobox.openSettings",
    label: "Open Settings",
    detail: "Open MemoBox settings in the VS Code settings editor.",
    icon: "gear"
  }
];

export function getMemoCommandLauncherDescriptors(options: { readonly aiEnabled?: boolean } = {}): readonly MemoCommandLauncherDescriptor[] {
  return memoCommandLauncherDescriptors.filter((descriptor) => !descriptor.requiresAi || options.aiEnabled === true);
}
