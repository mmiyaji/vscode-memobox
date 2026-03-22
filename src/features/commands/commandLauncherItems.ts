export interface MemoCommandLauncherDescriptor {
  readonly group: "Capture" | "Search" | "Manage" | "Workspace";
  readonly command: string;
  readonly label: string;
  readonly detail: string;
  readonly icon: string;
}

const memoCommandLauncherDescriptors: readonly MemoCommandLauncherDescriptor[] = [
  {
    group: "Capture",
    command: "memobox.newMemo",
    label: "New Memo",
    detail: "Create a new dated memo file from a title and optional template.",
    icon: "new-file"
  },
  {
    group: "Capture",
    command: "memobox.quickMemo",
    label: "Quick Memo",
    detail: "Append a timestamped entry to today's memo.",
    icon: "note"
  },
  {
    group: "Search",
    command: "memobox.listMemos",
    label: "List/Edit",
    detail: "Browse indexed memo files and open one quickly.",
    icon: "list-tree"
  },
  {
    group: "Search",
    command: "memobox.listTags",
    label: "Browse Tags",
    detail: "Open memo files grouped by frontmatter tags.",
    icon: "tag"
  },
  {
    group: "Search",
    command: "memobox.grepMemos",
    label: "Grep",
    detail: "Search across memo files with scoped filtering and previews.",
    icon: "search"
  },
  {
    group: "Search",
    command: "memobox.todoMemos",
    label: "Todo",
    detail: "Find todo lines across memo files.",
    icon: "checklist"
  },
  {
    group: "Search",
    command: "memobox.relatedMemos",
    label: "Related Memos",
    detail: "Suggest memo files related to the active memo.",
    icon: "references"
  },
  {
    group: "Manage",
    command: "memobox.redateMemo",
    label: "Re:Date",
    detail: "Rename the active memo so its filename uses today's date.",
    icon: "calendar"
  },
  {
    group: "Manage",
    command: "memobox.openMarkdownInBrowser",
    label: "Open Markdown In Browser",
    detail: "Render the active markdown file to HTML in your default browser.",
    icon: "globe"
  },
  {
    group: "Manage",
    command: "memobox.refreshIndex",
    label: "Refresh Index",
    detail: "Rebuild memo metadata for search, tags, and admin views.",
    icon: "refresh"
  },
  {
    group: "Workspace",
    command: "memobox.openMemoFolder",
    label: "Open Memo Folder",
    detail: "Open the memo root in a separate VS Code window.",
    icon: "folder-opened"
  },
  {
    group: "Workspace",
    command: "memobox.createWorkspace",
    label: "Create Workspace",
    detail: "Generate a MemoBox .code-workspace file for the memo root.",
    icon: "workspace-trusted"
  },
  {
    group: "Workspace",
    command: "memobox.openAdmin",
    label: "Open Admin",
    detail: "Show recent memos, pinned files, tags, templates, and index status.",
    icon: "dashboard"
  },
  {
    group: "Workspace",
    command: "memobox.openSetup",
    label: "Open Setup",
    detail: "Configure the memo root and optional workspace file.",
    icon: "tools"
  },
  {
    group: "Workspace",
    command: "memobox.openSettings",
    label: "Open Settings",
    detail: "Open MemoBox settings in the VS Code settings editor.",
    icon: "gear"
  }
];

export function getMemoCommandLauncherDescriptors(): readonly MemoCommandLauncherDescriptor[] {
  return memoCommandLauncherDescriptors;
}
