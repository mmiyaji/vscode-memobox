# MemoBox

MemoBox is a VS Code extension for daily memo workflows. This repository is being rebuilt as a fresh `v0.1.0` codebase with a cleaner architecture, stricter tooling, and a staged migration from the previous `vscode-memo-life-for-you` implementation.

## Status

- Project state: release hardening for `v0.1.x`
- Release line: `0.1.x`
- Migration approach: re-architecture first, feature port second

The current repository intentionally starts from a clean baseline. The initial goal was to establish maintainable project structure, testing, and release hygiene before porting the full feature set. That baseline is now in place, and the remaining work is focused on stability, packaging, and release readiness.

Commands currently available:

- `MemoBox: New Memo`
- `MemoBox: Quick Memo`
- `MemoBox: List/Edit`
- `MemoBox: Browse Tags`
- `MemoBox: Insert Memo Link`
- `MemoBox: Create Workspace`
- `MemoBox: Grep`
- `MemoBox: Todo`
- `MemoBox: Related Memos`
- `MemoBox: Re:Date`
- `MemoBox: Refresh Index`
- `MemoBox: Rebuild Index`
- `MemoBox: Clear Index Cache`
- `MemoBox: Open Memo Folder`
- `MemoBox: Open Markdown In Browser`
- `MemoBox: Open Setup`
- `MemoBox: Open Settings`
- `MemoBox: Open Admin`
- `MemoBox: AI Generate Title`
- `MemoBox: AI Summarize`
- `MemoBox: AI Auto Tag`
- `MemoBox: AI Proofread`
- `MemoBox: AI Translate`
- `MemoBox: AI Question`
- `MemoBox: AI Suggest Template`
- `MemoBox: AI Report`
- `MemoBox: AI Link Suggest`

`MemoBox: New Memo` supports seeded filenames from the current selection or clipboard, optional date suffixes, and template selection from `.vscode-memobox/templates/*.md`. When multiple templates exist, it prompts for a template, and cancelling that picker now aborts creation instead of silently falling back. MemoBox scaffolds the bundled starter files automatically from [`resources/scaffold`](C:\Users\mail\Documents\git\vscode-memobox\resources\scaffold): `simple.md`, `meeting.md`, and `memo.json`, both for the default meta directories and for workspace-mode `.templates` / `.snippets`. The default templates now start with YAML frontmatter and include `title`, `tags`, and `date`; `simple.md` always includes a starter `inbox` tag.

`MemoBox: Grep` supports scoped search, cancellation, result caps, multiple result view modes, interactive QuickPick preview with match highlighting, and now skips unreadable files instead of failing the whole run. `MemoBox: Todo` reuses the same scoped preview flow for regex-based todo extraction and the same unreadable-file tolerance. `MemoBox: Refresh Index` reports skipped files during refresh, while `MemoBox: Rebuild Index` clears saved index files before rebuilding and `MemoBox: Clear Index Cache` removes persisted index files without touching memo content.

`MemoBox: Browse Tags` aggregates frontmatter `tags` from indexed memos. `MemoBox: Insert Memo Link` inserts a relative Markdown link to another memo, using the current selection as the link label when available and otherwise falling back to the target memo title or filename. Markdown completion also suggests memo links while typing `[[...` or a Markdown link target such as `[Label](`. `MemoBox: Related Memos` uses shared tags, filename/title tokens, folder proximity, and nearby dates to suggest related notes without AI. `MemoBox: Create Workspace` generates a `MemoBox.code-workspace` file for the memo root with `MemoBox` as the workspace name, and reuses the legacy-style `.templates` / `.snippets` workspace paths. `MemoBox: Open Markdown In Browser` renders the active Markdown document to HTML and opens it in your default browser. `MemoBox: Open Setup` is the dedicated first-run and repair flow for global memo-root setup and optional workspace generation. Admin is kept as an operational dashboard for recent files, pinned files, tags, templates, snippets, and index status. Markdown completions can also load from `.vscode-memobox/snippets/*.json`.

AI is opt-in. `memobox.aiEnabled` is `false` by default, and when it stays off the AI commands are hidden from the command palette and the editor submenu. The structured AI connection settings live under `memobox.ai`, with provider profiles, timeouts, and network options grouped in one JSON object.

Default keybindings are also available:

- `Ctrl+Alt+N` for `New Memo`
- `Ctrl+Alt+T` for `Quick Memo`
- `Ctrl+Alt+G` for `Grep`
- `Ctrl+Alt+Shift+M` for `Open Admin`

## Current Feature Set

- Daily memo creation with date-based folders
- Quick append to today's memo
- List, tag browse, grep, and todo extraction
- Relative memo link insertion from the active editor
- Non-AI related memo discovery
- Memo admin dashboard with first-run setup
- Metadata index persistence, backup recovery, and manual refresh / rebuild / clear operations
- Workspace-file generation for dedicated memo environments
- Template and snippet scaffolding from bundled resources
- Localized command, settings, Admin, and Setup UI
- Optional AI title, summary, tag, translation, Q&A, report, and link assistance

## Release Readiness

- Unit tests cover pure core modules such as indexing, grep/todo, tags, related memos, templates, snippets, and workspace generation.
- Playwright E2E covers first-run Setup rendering, Setup completion to workspace creation, Admin pin/unpin, New Memo template selection, Grep/Todo quick-pick flows, settings grouping, and AI command visibility.
- VSIX packaging excludes docs, tests, scripts, Playwright assets, and source maps through [`.vscodeignore`](C:\Users\mail\Documents\git\vscode-memobox\.vscodeignore).

Current `0.1.x` focus:

- stabilize operational edge cases
- keep packaging and docs in sync with shipped behavior
- keep AI features explicitly opt-in and low-friction to disable

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

The current release candidate exposes this settings surface:

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
- `memobox.aiEnabled`
- `memobox.ai`

This list is expected to stay relatively small through `0.1.x`. Future settings growth should be driven by clear workflow value rather than one-to-one migration of legacy toggles.

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

The E2E suite launches the locally installed VS Code desktop app through Playwright's Electron support and currently covers Setup, Admin, New Memo template selection, and Grep/Todo quick-pick flows.

## License

MIT
