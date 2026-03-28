# Changelog

## 0.1.0

- Released MemoBox `v0.1.0` with strict TypeScript, tests, CI, and VSIX packaging.
- Implemented core daily memo workflows: New Memo, Quick Memo, List/Edit, Grep, Todo, Re:Date, Open Folder, and Open Markdown In Browser.
- Added memo link insertion, Markdown link completion, backlink lookup, and `[[memo]]` open-or-create flow.
- Added Markdown authoring helpers: slash commands, Markdown table formatting, and footnote insertion.
- Added custom pages under `.vscode-memobox/pages/`, including Admin integration, safe template variables, and Command Palette access via `MemoBox: Open Custom Page`.
- Added AI cost estimation modes, monthly usage tracking, configurable request/monthly limits, and Admin visibility for AI cost state.
- Added metadata index persistence, backup recovery, incremental updates, first-run setup guidance, global memo-root setup, optional workspace-file generation, pinned/recent Admin panels, template/snippet management, frontmatter tag browsing, non-AI related memo discovery, and manual index refresh.
- Localized commands, settings, Setup, Admin, command launcher, and README for Japanese and English.
- Hardened Setup and custom page webviews with whitelisted command dispatch and path restrictions for open/reveal actions.
- Hardened index refresh and Grep/Todo so unreadable or removed files are skipped instead of aborting the whole command.
- Improved AI resilience with SecretStorage-first API key resolution, progress feedback, retry handling for transient failures, and safer defaults.
- Improved Admin usability with clearer daily/maintenance separation, startup toggles, custom page links, and log access from the dashboard.
- Fixed New Memo so cancelling the template picker cancels memo creation instead of silently falling back.
- Fixed cross-platform Markdown browser preview path handling so README preview tests pass on GitHub Actions.
- Fixed workspace generation so templates and snippets consistently live under `.vscode-memobox/` instead of mixed top-level directories.
- Fixed packaging and release flow so tag-driven releases derive the VSIX version dynamically, while local packaging uses the current `package.json` version.
- Expanded Playwright E2E to cover setup completion, template-based memo creation, Grep/Todo flows, and release media capture.
