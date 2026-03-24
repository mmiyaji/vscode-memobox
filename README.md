# MemoBox

[Japanese README](./README.ja.md)

MemoBox is a VS Code extension for daily memo workflows. It focuses on a maintainable architecture, practical memo operations, and an opt-in AI layer.

## Status

- Release line: `0.1.x`
- Current focus: stability, maintainability, and release readiness
MemoBox is already usable as a daily memo tool. The remaining `0.1.x` work is mostly UX polish, resilience, and packaging quality rather than broad feature churn.

## Screenshots

Admin dashboard:

![MemoBox admin dashboard](./docs/screenshots/admin-overview.png)

First-run setup:

![MemoBox setup flow](./docs/screenshots/setup-flow.png)

Workflow demo:

![MemoBox memo workflow demo](./docs/screenshots/memo-workflow.gif)

Quick memo:

![MemoBox quick memo demo](./docs/screenshots/quick-memo.gif)

Grep:

![MemoBox grep workflow demo](./docs/screenshots/grep-workflow.gif)

Setup:

![MemoBox setup workflow demo](./docs/screenshots/setup-workflow.gif)

AI title assist:

![MemoBox AI title workflow demo](./docs/screenshots/ai-title-workflow.gif)

## Features

- Dated memo creation with template selection
- Quick append into today's memo
- List/Edit, tag browse, grep, todo extraction, and related memo discovery
- Relative memo link insertion and Markdown link completion
- Admin dashboard, Setup flow, and workspace-file generation
- Persisted memo index with backup recovery, incremental updates, and maintenance commands
- Template and snippet scaffolding from bundled resources
- Localized command titles, settings, Admin UI, and Setup UI
- Output-channel logging for MemoBox and AI operations
- Optional AI title, summary, tag, translation, Q&A, report, and link assistance

## Commands

Core commands:

- `MemoBox: New Memo`
- `MemoBox: Today's Quick Memo`
- `MemoBox: List/Edit`
- `MemoBox: Browse Tags`
- `MemoBox: Insert Memo Link`
- `MemoBox: Grep`
- `MemoBox: Todo`
- `MemoBox: Related Memos`
- `MemoBox: Re:Date`
- `MemoBox: Open Markdown In Browser`

Setup and maintenance:

- `MemoBox Admin: Open Admin`
- `MemoBox Admin: Open Setup`
- `MemoBox Admin: Open Settings`
- `MemoBox Admin: Create Workspace`
- `MemoBox Admin: Open Memo Folder`
- `MemoBox Admin: Refresh Index`
- `MemoBox Admin: Rebuild Index`
- `MemoBox Admin: Clear Index Cache`
- `MemoBox Admin: Show Logs`
- `MemoBox Admin: Show AI Logs`

AI commands, hidden by default until `memobox.aiEnabled` is enabled:

- `MemoBox: AI Generate Title`
- `MemoBox: AI Summarize`
- `MemoBox: AI Auto Tag`
- `MemoBox: AI Proofread`
- `MemoBox: AI Translate`
- `MemoBox: AI Question`
- `MemoBox: AI Suggest Template`
- `MemoBox: AI Report`
- `MemoBox: AI Link Suggest`
- `MemoBox: AI Set API Key`
- `MemoBox: AI Clear Stored API Key`

Default keybindings:

- `Ctrl+Alt+N` for `New Memo`
- `Ctrl+Alt+T` for `Today's Quick Memo`
- `Ctrl+Alt+G` for `Grep`
- `Ctrl+Alt+Shift+M` for `Open Admin`

## Daily Workflow

`MemoBox: New Memo` creates a dated memo file under `memobox.memodir` using `memobox.datePathFormat`. It supports template selection from `.vscode-memobox/templates/*.md`, seeded filenames from the current selection or clipboard, and optional date suffixes.

`MemoBox: Today's Quick Memo` appends a timestamped block to today's memo. `titlePrefix` and `dateFormat` control the inserted heading format.

`MemoBox: Insert Memo Link` inserts a relative Markdown link to another memo. Link completion also works while typing `[[...` or a Markdown link target like `[Label](`, and it tolerates small typos in longer queries.

## Command Launcher

`MemoBox: Commands` opens a grouped QuickPick launcher for Daily, Context, Maintenance, and AI commands. It is optional, but useful when you want a smaller command surface than the global Command Palette.

## Templates and Snippets

MemoBox scaffolds bundled starter assets from [`resources/scaffold`](/C:/Users/mail/Documents/git/vscode-memobox/resources/scaffold) into the memo metadata directories. The default scaffold currently includes:

- `simple.md`
- `meeting.md`
- `memo.json`

The default templates start with YAML frontmatter and include:

- `title`
- `tags`
- `date`

`simple.md` includes a starter `inbox` tag. Template and snippet directories can live either under the default meta directory or at custom absolute paths via settings.

## Indexing Model

MemoBox keeps a persisted metadata index for memo files. That index stores path, timestamps, size, frontmatter `title`, and frontmatter `tags`, but does not cache full memo bodies.

Current behavior:

- Initial load reads the persisted index from `primary -> backup -> transient backup`
- Normal editing uses incremental updates driven by save, create, delete, and rename events
- Full recursive scans are reserved for first load, explicit maintenance refreshes, unknown change sources, and periodic verification
- Unreadable files are skipped instead of failing the whole operation
- Safe writes use temp files plus backup files to reduce corruption risk

This index powers:

- `List/Edit`
- `Browse Tags`
- `Related Memos`
- `Grep`
- `Todo`
- Memo link insertion and completion
- Admin summaries

## Admin and Setup

MemoBox uses two separate webviews:

- `Setup`
  Used for first-run and repair flows. It stores `memobox.memodir` globally first, then optionally creates a `.code-workspace` file.
- `Admin`
  Used as an operational dashboard for recent files, pinned files, tags, templates, snippets, AI status, logs, and index state.

The Admin dashboard can also toggle `memobox.adminOpenOnStartup`.

## AI

AI is explicitly opt-in.

- `memobox.aiEnabled`
  Default: `false`
- `memobox.ai`
  Structured JSON configuration for profiles, provider settings, timeouts, and network options

When AI is disabled:

- AI commands are hidden from the Command Palette
- AI submenu entries are hidden from the Markdown editor context menu

API keys are resolved in this order:

1. VS Code SecretStorage
2. `apiKeyEnv`
3. `apiKey` in settings JSON (legacy compatibility)

For OpenAI-style profiles, SecretStorage or environment variables are preferred over direct settings JSON.

Set an API key with SecretStorage:

1. Enable `memobox.aiEnabled`.
2. Configure `memobox.ai` with the profile you want to use.
3. Open the Command Palette and run `MemoBox: AI Set API Key`.
4. Choose the target profile.
5. Paste the API key and confirm.

The stored key does not appear in `settings.json`. To remove it, run `MemoBox: AI Clear Stored API Key`.

## Logging

MemoBox writes to two VS Code output channels:

- `MemoBox`
- `MemoBox AI`

Use `memobox.logLevel` to control verbosity. The default is `warn`.

- `off`
- `error`
- `warn`
- `info`

The Admin dashboard includes buttons to open both log channels.

## Configuration

Current settings surface:

- `memobox.memodir`
- `memobox.datePathFormat`
- `memobox.memotemplate`
- `memobox.metaDir`
- `memobox.templatesDir`
- `memobox.snippetsDir`
- `memobox.titlePrefix`
- `memobox.dateFormat`
- `memobox.memoNewFilenameFromClipboard`
- `memobox.memoNewFilenameFromSelection`
- `memobox.memoNewFilenameDateSuffix`
- `memobox.listSortOrder`
- `memobox.listDisplayExtname`
- `memobox.displayFileBirthTime`
- `memobox.openMarkdownPreview`
- `memobox.searchMaxResults`
- `memobox.excludeDirectories`
- `memobox.maxScanDepth`
- `memobox.grepViewMode`
- `memobox.todoPattern`
- `memobox.relatedMemoLimit`
- `memobox.recentCount`
- `memobox.adminOpenOnStartup`
- `memobox.locale`
- `memobox.logLevel`
- `memobox.aiEnabled`
- `memobox.ai`

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
npm run capture:readme-screenshots
npm run capture:readme-gif
```

Run the extension in VS Code:

1. Open this repository in VS Code.
2. Run `npm install`.
3. Press `F5` to launch the extension host.
4. Run `MemoBox Admin: Open Admin` from the Command Palette.

## Packaging and Tests

- Unit tests cover core logic such as indexing, grep/todo, tags, related memos, templates, snippets, logging, and link completion.
- Playwright E2E covers Setup, Admin pin/unpin, New Memo template selection, Grep/Todo flows, settings grouping, and AI command visibility.
- VSIX packaging excludes docs, tests, Playwright assets, scripts, and source maps through [`.vscodeignore`](/C:/Users/mail/Documents/git/vscode-memobox/.vscodeignore).

Package a VSIX:

```bash
npm run package:vsix
```

## Repository Structure

```text
src/
  core/         domain logic and configuration
  features/     VS Code commands and UI features
  infra/        provider-specific integrations such as AI
  shared/       shared helpers and extension metadata
test/           unit tests for pure modules
docs/           product notes and planning
resources/      scaffold files and webview templates
```

## License

MIT

MemoBox is developed under the influence of [satokaz/vscode-memo-life-for-you](https://github.com/satokaz/vscode-memo-life-for-you). It is an experimental extension shaped around the features I personally want to use.
