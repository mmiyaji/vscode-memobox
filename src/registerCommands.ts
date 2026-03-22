import * as vscode from "vscode";

import { grepMemosCommand } from "./features/commands/grepMemosCommand";
import { listMemos } from "./features/commands/listMemosCommand";
import { listTagsCommand } from "./features/commands/listTagsCommand";
import { createWorkspaceCommand } from "./features/commands/createWorkspaceCommand";
import { newMemo } from "./features/commands/newMemoCommand";
import { openMarkdownInBrowserCommand } from "./features/commands/openMarkdownInBrowserCommand";
import { openCommandLauncherCommand } from "./features/commands/openCommandLauncherCommand";
import { openMemoFolderCommand } from "./features/commands/openMemoFolderCommand";
import { openSettingsCommand } from "./features/commands/openSettingsCommand";
import { quickMemo } from "./features/commands/quickMemoCommand";
import { refreshIndexCommand } from "./features/commands/refreshIndexCommand";
import { redateMemoCommand } from "./features/commands/redateMemoCommand";
import { relatedMemosCommand } from "./features/commands/relatedMemosCommand";
import { todoMemosCommand } from "./features/commands/todoMemosCommand";
import { openAdmin } from "./features/admin/openAdminCommand";
import { openSetup } from "./features/setup/openSetupCommand";

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("memobox.newMemo", async () => {
      await newMemo();
    }),
    vscode.commands.registerCommand("memobox.quickMemo", async () => {
      await quickMemo();
    }),
    vscode.commands.registerCommand("memobox.listMemos", async () => {
      await listMemos();
    }),
    vscode.commands.registerCommand("memobox.listTags", async () => {
      await listTagsCommand();
    }),
    vscode.commands.registerCommand("memobox.createWorkspace", async () => {
      await createWorkspaceCommand();
    }),
    vscode.commands.registerCommand("memobox.grepMemos", async () => {
      await grepMemosCommand();
    }),
    vscode.commands.registerCommand("memobox.todoMemos", async () => {
      await todoMemosCommand();
    }),
    vscode.commands.registerCommand("memobox.relatedMemos", async () => {
      await relatedMemosCommand();
    }),
    vscode.commands.registerCommand("memobox.redateMemo", async () => {
      await redateMemoCommand();
    }),
    vscode.commands.registerCommand("memobox.refreshIndex", async () => {
      await refreshIndexCommand();
    }),
    vscode.commands.registerCommand("memobox.openMemoFolder", async () => {
      await openMemoFolderCommand();
    }),
    vscode.commands.registerCommand("memobox.openMarkdownInBrowser", async () => {
      await openMarkdownInBrowserCommand();
    }),
    vscode.commands.registerCommand("memobox.openCommandLauncher", async () => {
      await openCommandLauncherCommand();
    }),
    vscode.commands.registerCommand("memobox.openSettings", async () => {
      await openSettingsCommand();
    }),
    vscode.commands.registerCommand("memobox.openAdmin", () => {
      void openAdmin(context);
    }),
    vscode.commands.registerCommand("memobox.openSetup", () => {
      void openSetup(context);
    }),
    vscode.commands.registerCommand("extension.memoNew", async () => {
      await newMemo();
    }),
    vscode.commands.registerCommand("extension.memoQuick", async () => {
      await quickMemo();
    }),
    vscode.commands.registerCommand("extension.memoEdit", async () => {
      await listMemos();
    }),
    vscode.commands.registerCommand("extension.memoGrep", async () => {
      await grepMemosCommand();
    }),
    vscode.commands.registerCommand("extension.memoConfig", async () => {
      await openSettingsCommand();
    }),
    vscode.commands.registerCommand("extension.memoReDate", async () => {
      await redateMemoCommand();
    }),
    vscode.commands.registerCommand("extension.memoTodo", async () => {
      await todoMemosCommand();
    }),
    vscode.commands.registerCommand("extension.memoRelated", async () => {
      await relatedMemosCommand();
    }),
    vscode.commands.registerCommand("extension.memoOpenFolder", async () => {
      await openMemoFolderCommand();
    }),
    vscode.commands.registerCommand("extension.memoOpenChrome", async () => {
      await openMarkdownInBrowserCommand();
    }),
    vscode.commands.registerCommand("extension.memoAdmin", () => {
      void openAdmin(context);
    })
  );
}
