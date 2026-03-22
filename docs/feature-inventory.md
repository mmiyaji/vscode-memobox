# Feature Inventory

This inventory is based on the sibling `vscode-memo-life-for-you` extension and is used to decide what belongs in MemoBox `v0.1.0`.

## Must-Have For v0.1.0

- memo root configuration
- date-based memo file creation
- quick memo append flow
- memo list and open flow
- memo grep flow
- todo extraction
- memo redate
- open memo folder
- core template and snippet resolution
- lightweight file index

## Likely After v0.1.0

- admin dashboard
- workspace file generation
- pinned files
- recent-file statistics
- tag analytics
- advanced grep presentation modes

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
