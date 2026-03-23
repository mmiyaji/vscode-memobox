# Feature Inventory

This inventory is based on the sibling `vscode-memo-life-for-you` extension and is used to decide what belongs in MemoBox `v0.1.0`.

## Implemented In v0.1.x

- memo root configuration
- date-based memo file creation
- quick memo append flow
- memo list and open flow
- memo grep flow
- todo extraction
- tag browsing
- non-AI related memo discovery
- memo redate
- open memo folder
- browser markdown preview
- core template and snippet resolution
- setup flow
- admin dashboard
- pinned files
- recent-file statistics
- workspace file generation
- lightweight file index

## Likely After v0.1.x

- tag analytics beyond the current browse flow
- richer search diagnostics and saved result views
- more workspace ergonomics
- targeted performance work based on real memo-tree size

## Optional / Later

- AI auto-tagging
- AI summarization
- AI related memo discovery
- AI report generation
- AI proofreading
- AI translation
- external Chrome-based editing helpers

## Legacy Cleanup Targets

- split large files such as `memoAdmin.ts` and `memoAi.ts`
- replace ad-hoc configuration reads with typed settings access
- remove unused build dependencies
- eliminate legacy naming from docs and release assets
- verify text encoding and remove garbled strings before porting localized content
