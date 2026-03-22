# Migration Plan

## Goal

Rebuild MemoBox as a fresh `v0.1.0` extension with a maintainable architecture, modern tooling, and a staged feature migration from the previous extension codebase.

## Principles

- Treat this repository as a new product line.
- Migrate behavior, not file layout.
- Keep domain logic testable outside the VS Code API where possible.
- Avoid carrying forward unused dependencies, old naming, and generated artifacts.

## Target Architecture

```text
src/
  extension.ts
  core/
    config/
    memo/
    index/
  features/
    admin/
    commands/
    grep/
    todo/
    ai/
  shared/
```

## Phases

### Phase 1: Foundation

- Set up strict TypeScript, linting, tests, packaging, and CI
- Create initial command and settings structure
- Document migration scope and priorities

### Phase 2: Core Domain

- Port settings parsing into typed config modules
- Port memo path/date logic
- Port file-system helpers and metadata directory conventions
- Port index storage and refresh logic

### Phase 3: Must-Have Commands

- New memo
- Quick memo
- List/Edit
- Grep
- Todo
- Re-date
- Open memo folder

### Phase 4: Admin Experience

- Rebuild the admin dashboard with separated rendering and message handling
- Reintroduce recent files, pinned files, stats, setup flow, and workspace generation
- Add setup guidance for missing memo roots and maintenance actions such as index refresh

### Phase 5: AI Features

- Move HTTP and provider logic into `infra/llm`
- Port AI commands one by one behind explicit feature settings
- Add dedicated tests around prompt builders and result parsing

### Phase 6: Release Hardening

- Refresh screenshots and README
- Finalize `package.nls*`
- Add lightweight end-to-end coverage
- Package and publish `v0.1.0`
- Keep non-AI related memo discovery and tag browsing in the stable core release line

## Non-Goals For Initial Scaffold

- Full command parity on day one
- Carrying over old command IDs without review
- Porting generated files or old release artifacts
