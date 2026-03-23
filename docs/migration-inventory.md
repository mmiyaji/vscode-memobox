# Migration Inventory

This document summarizes what is currently present in `vscode-memo-life-for-you` and how it should be prioritized for the new `MemoBox v0.1.0` codebase.

## Feature Groups

### Implemented In 0.1.x

- Memo creation and quick append workflows
- Memo list/edit picker
- Frontmatter tag aggregation and tag browsing
- Grep and todo extraction
- Non-AI related memo discovery
- Date-based path generation
- Memo folder opening
- Admin setup flow and dashboard
- Typed settings and metadata directory support
- Workspace generation flow
- Snippet loading and watching
- Multi-language package metadata

### Later

- richer search presentation and diagnostics
- file watchers beyond snippet completion, where justified by runtime cost
- additional release polish such as screenshots and marketplace-facing copy

### Optional

- AI-assisted commands
- Chrome/contenteditable integration
- Legacy compatibility aliases for old command IDs
- Theme-heavy admin customization

## Legacy Command Inventory

Implemented:

- `extension.memoNew`
- `extension.memoQuick`
- `extension.memoEdit`
- `extension.memoGrep`
- `extension.memoTodo`
- `extension.memoReDate`
- `extension.memoOpenFolder`
- `extension.memoAdmin`
- `extension.memoConfig`
- `extension.memoOpenChrome` (mapped to browser-based Markdown preview)

Later candidates:

Optional AI candidates:

- `extension.memoAutoTag`
- `extension.memoSummarize`
- `extension.memoRelated`
- `extension.memoExtractTodos`
- `extension.memoReport`
- `extension.memoProofread`
- `extension.memoQA`
- `extension.memoSuggestTemplate`
- `extension.memoGenerateTitle`
- `extension.memoTranslate`
- `extension.memoLinkSuggest`

## Configuration Areas

Core settings:

- `memodir`
- `memotemplate`
- `memoDatePathFormat`
- `memoMetaDir`
- `listDisplayExtname`
- `titlePrefix`
- `dateFormat`
- `memoNewFilenameFromClipboard`
- `memoNewFilenameFromSelection`
- `memoNewFilNameDateSuffix`

Search and editing:

- `listSortOrder`
- `displayFileBirthTime`
- `listMarkdownPreview`
- `openMarkdownPreview`
- `openMarkdownPreviewUseMPE`
- `memoGrepViewMode`
- `memoGrepUseRipGrepConfigFile`
- `memoGrepUseRipGrepConfigFilePath`
- `memoTodoUserePattern`
- `withRespectMode`
- `gutterIconPath`
- `gutterIconSize`
- `grepLineBackgroundColor`
- `grepKeywordBackgroundColor`

Admin:

- `memoAdminAppearance`
- `memoAdminColorTheme`
- `memoDisplayLanguage`
- `memoAdminUseGradient`
- `memoAdminAdvancedMode`
- `memoAdminOpenMode`
- `memoAdminOpenOnStartup`
- `memoPinnedFiles`
- `memoRecentCount`
- `memoTemplatesDir`
- `memoSnippetsDir`

AI:

- `aiEnabled`
- `aiProvider`
- `aiEndpoint`
- `aiModel`
- `aiApiKey`
- `aiTagLanguage`
- `aiProxy`
- `aiProxyBypass`
- `aiTlsRejectUnauthorized`
- `aiTlsCaCert`

## Cleanup Targets From Legacy Repo

- Remove unused `gulp*`, `del`, `event-stream`, and `glob` dependencies unless a real need remains
- Replace oversized files with smaller feature-focused modules
- Recreate README and release naming under the MemoBox identity
- Rebuild package localization files to avoid carrying forward broken strings and encoding issues
- Exclude generated directories and packaged artifacts from source control

## Next Phase

- tighten release packaging and documentation
- continue hardening file-system edge cases for large memo trees
- expand E2E around setup, search, and template-driven memo creation
- defer AI to a separately designed release line
