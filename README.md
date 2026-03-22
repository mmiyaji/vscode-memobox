# MemoBox

MemoBox is a VS Code extension for daily memo workflows. This repository is being rebuilt as a fresh `v0.1.0` codebase with a cleaner architecture, stricter tooling, and a staged migration from the previous `vscode-memo-life-for-you` implementation.

## Status

- Project state: active rebuild
- Release line: `0.1.x`
- Migration approach: re-architecture first, feature port second

The current repository intentionally starts from a clean baseline. The initial goal is to establish maintainable project structure, testing, and release hygiene before porting the full feature set.

Commands currently available:

- `MemoBox: New Memo`
- `MemoBox: Quick Memo`
- `MemoBox: List/Edit`
- `MemoBox: Browse Tags`
- `MemoBox: Create Workspace`
- `MemoBox: Grep`
- `MemoBox: Todo`
- `MemoBox: Related Memos`
- `MemoBox: Re:Date`
- `MemoBox: Refresh Index`
- `MemoBox: Open Memo Folder`
- `MemoBox: Open Markdown In Browser`
- `MemoBox: Open Setup`
- `MemoBox: Open Settings`
- `MemoBox: Open Admin`

`MemoBox: New Memo` supports seeded filenames from the current selection or clipboard, optional date suffixes, and template selection from `.vscode-memobox/templates/*.md`. When multiple templates exist, it prompts for a template and still keeps the configured default or built-in template as the fallback option. MemoBox now scaffolds the bundled legacy starter files automatically from [`resources/scaffold`](C:\Users\mail\Documents\git\vscode-memobox\resources\scaffold): `simple.md`, `meeting.md`, and `memo.json`, both for the default meta directories and for workspace-mode `.templates` / `.snippets`. `MemoBox: Grep` supports scoped search, cancellation, result caps, multiple result view modes, and interactive QuickPick preview with match highlighting. `MemoBox: Todo` reuses the same scoped preview flow for regex-based todo extraction. `MemoBox: Browse Tags` aggregates frontmatter `tags` from indexed memos. `MemoBox: Related Memos` uses shared tags, filename/title tokens, folder proximity, and nearby dates to suggest related notes without AI. `MemoBox: Create Workspace` generates a `MemoBox.code-workspace` file for the memo root with `MemoBox` as the workspace name, and reuses the legacy-style `.templates` / `.snippets` workspace paths. `MemoBox: Open Markdown In Browser` renders the active Markdown document to HTML and opens it in your default browser. `MemoBox: Open Setup` is the dedicated first-run and repair flow for global memo-root setup and optional workspace generation. Admin is kept as an operational dashboard for recent files, pinned files, tags, templates, snippets, and index status. Markdown completions can also load from `.vscode-memobox/snippets/*.json`.

Default keybindings are also available:

- `Ctrl+Alt+N` for `New Memo`
- `Ctrl+Alt+T` for `Quick Memo`
- `Ctrl+Alt+G` for `Grep`
- `Ctrl+Alt+Shift+M` for `Open Admin`

## Current Feature Set

- Daily memo creation with date-based folders
- Quick append to today's memo
- List, tag browse, grep, and todo extraction
- Non-AI related memo discovery
- Memo admin dashboard with first-run setup
- Metadata index persistence and manual refresh
- Optional AI-assisted memo workflows planned later

## Repository Structure

```text
src/
  core/         domain logic and configuration
  features/     VS Code commands and UI features
  shared/       shared helpers and extension metadata
test/           unit tests for pure modules
docs/           migration notes and architecture planning
```

## Development

Requirements:

- Node.js `20.19.0`
- npm `10.x`

Commands:

```bash
npm install
npm run build
npm run lint
npm run test
npm run validate
npm run test:e2e
```

Run the extension in VS Code:

1. Open this repository in VS Code.
2. Run `npm install`.
3. Press `F5` to launch the extension host.
4. Run `MemoBox: Open Admin` from the Command Palette.

On first run, MemoBox opens a dedicated Setup view. It stores `memobox.memodir` globally first, then offers workspace-specific behavior such as optional `.code-workspace` generation as a separate step.

## Configuration

The initial scaffold exposes a minimal settings surface:

- `memobox.memodir`
- `memobox.datePathFormat`
- `memobox.memotemplate`
- `memobox.metaDir`
- `memobox.templatesDir`
- `memobox.snippetsDir`
- `memobox.searchMaxResults`
- `memobox.relatedMemoLimit`
- `memobox.titlePrefix`
- `memobox.dateFormat`
- `memobox.memoNewFilenameFromClipboard`
- `memobox.memoNewFilenameFromSelection`
- `memobox.memoNewFilenameDateSuffix`
- `memobox.listSortOrder`
- `memobox.listDisplayExtname`
- `memobox.displayFileBirthTime`
- `memobox.openMarkdownPreview`
- `memobox.grepViewMode`
- `memobox.todoPattern`
- `memobox.recentCount`
- `memobox.adminOpenOnStartup`
- `memobox.locale`

These are expected to expand as feature migration progresses.

MemoBox also reads a small set of legacy setting names while migrating from the previous extension line, including `memoDatePathFormat`, `memoMetaDir`, `memoGrepViewMode`, `memoTodoUserePattern`, `memoNewFilNameDateSuffix`, and `memoDisplayLanguage`.

## Migration Docs

- [Migration inventory](./docs/migration-inventory.md)
- [Migration plan](./docs/migration-plan.md)

## Publishing

Package a VSIX:

```bash
npm run package:vsix
```

Playwright E2E:

- `npm run test:e2e`
- `npm run test:e2e:headed`

The E2E suite launches the locally installed VS Code desktop app through Playwright's Electron support and currently covers the MemoBox Admin webview, including first-run setup rendering.

## License

MIT
