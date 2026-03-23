# Changelog

## 0.1.0

- Released MemoBox `v0.1.0` with strict TypeScript, tests, CI, and VSIX packaging.
- Implemented core daily memo workflows: New Memo, Quick Memo, List/Edit, Grep, Todo, Re:Date, Open Folder, and Open Markdown In Browser.
- Added metadata index persistence, first-run setup guidance, global memo-root setup, optional workspace-file generation, pinned/recent Admin panels, template/snippet management, frontmatter tag browsing, non-AI related memo discovery, and manual index refresh.
- Localized commands, settings, Setup, and Admin for Japanese and English.
- Hardened index refresh and Grep/Todo so unreadable or removed files are skipped instead of aborting the whole command.
- Fixed New Memo so cancelling the template picker cancels memo creation instead of silently falling back.
- Expanded Playwright E2E to cover setup completion, template-based memo creation, and Grep/Todo quick-pick flows.
