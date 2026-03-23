import * as vscode from "vscode";

import { askMemoQuestionCommand } from "./features/ai/askMemoQuestionCommand";
import { autoTagMemoCommand } from "./features/ai/autoTagMemoCommand";
import { generateAiTitleCommand } from "./features/ai/generateTitleCommand";
import { linkSuggestCommand } from "./features/ai/linkSuggestCommand";
import { clearAiApiKeyCommand, setAiApiKeyCommand } from "./features/ai/manageApiKeyCommands";
import { proofreadMemoCommand } from "./features/ai/proofreadMemoCommand";
import { reportMemoCommand } from "./features/ai/reportMemoCommand";
import { suggestTemplateCommand } from "./features/ai/suggestTemplateCommand";
import { summarizeMemoCommand } from "./features/ai/summarizeMemoCommand";
import { translateMemoCommand } from "./features/ai/translateMemoCommand";
import { grepMemosCommand } from "./features/commands/grepMemosCommand";
import { insertMemoLinkCommand } from "./features/commands/insertMemoLinkCommand";
import { listMemos } from "./features/commands/listMemosCommand";
import { listTagsCommand } from "./features/commands/listTagsCommand";
import { createWorkspaceCommand } from "./features/commands/createWorkspaceCommand";
import { clearIndexCacheCommand } from "./features/commands/clearIndexCacheCommand";
import { newMemo } from "./features/commands/newMemoCommand";
import { openMarkdownInBrowserCommand } from "./features/commands/openMarkdownInBrowserCommand";
import { openCommandLauncherCommand } from "./features/commands/openCommandLauncherCommand";
import { openMemoFolderCommand } from "./features/commands/openMemoFolderCommand";
import { openSettingsCommand } from "./features/commands/openSettingsCommand";
import { quickMemo } from "./features/commands/quickMemoCommand";
import { refreshIndexCommand } from "./features/commands/refreshIndexCommand";
import { rebuildIndexCommand } from "./features/commands/rebuildIndexCommand";
import { redateMemoCommand } from "./features/commands/redateMemoCommand";
import { relatedMemosCommand } from "./features/commands/relatedMemosCommand";
import { todoMemosCommand } from "./features/commands/todoMemosCommand";
import { openAdmin } from "./features/admin/openAdminCommand";
import { openSetup } from "./features/setup/openSetupCommand";
import { showMemoBoxAiLogs, showMemoBoxLogs } from "./shared/logging";

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
    vscode.commands.registerCommand("memobox.insertMemoLink", async () => {
      await insertMemoLinkCommand();
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
    vscode.commands.registerCommand("memobox.rebuildIndex", async () => {
      await rebuildIndexCommand();
    }),
    vscode.commands.registerCommand("memobox.clearIndexCache", async () => {
      await clearIndexCacheCommand();
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
    vscode.commands.registerCommand("memobox.showLogs", async () => {
      showMemoBoxLogs();
    }),
    vscode.commands.registerCommand("memobox.showAiLogs", async () => {
      showMemoBoxAiLogs();
    }),
    vscode.commands.registerCommand("memobox.openAdmin", () => {
      void openAdmin(context);
    }),
    vscode.commands.registerCommand("memobox.openSetup", () => {
      void openSetup(context);
    }),
    vscode.commands.registerCommand("memobox.aiAutoTag", async () => {
      await autoTagMemoCommand();
    }),
    vscode.commands.registerCommand("memobox.aiSummarize", async () => {
      await summarizeMemoCommand();
    }),
    vscode.commands.registerCommand("memobox.aiGenerateTitle", async () => {
      await generateAiTitleCommand();
    }),
    vscode.commands.registerCommand("memobox.aiProofread", async () => {
      await proofreadMemoCommand();
    }),
    vscode.commands.registerCommand("memobox.aiTranslate", async () => {
      await translateMemoCommand();
    }),
    vscode.commands.registerCommand("memobox.aiQuestion", async () => {
      await askMemoQuestionCommand();
    }),
    vscode.commands.registerCommand("memobox.aiSuggestTemplate", async () => {
      await suggestTemplateCommand();
    }),
    vscode.commands.registerCommand("memobox.aiReport", async () => {
      await reportMemoCommand();
    }),
    vscode.commands.registerCommand("memobox.aiLinkSuggest", async () => {
      await linkSuggestCommand();
    }),
    vscode.commands.registerCommand("memobox.aiSetApiKey", async () => {
      await setAiApiKeyCommand();
    }),
    vscode.commands.registerCommand("memobox.aiClearApiKey", async () => {
      await clearAiApiKeyCommand();
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
    vscode.commands.registerCommand("extension.memoInsertLink", async () => {
      await insertMemoLinkCommand();
    }),
    vscode.commands.registerCommand("extension.memoOpenFolder", async () => {
      await openMemoFolderCommand();
    }),
    vscode.commands.registerCommand("extension.memoOpenChrome", async () => {
      await openMarkdownInBrowserCommand();
    }),
    vscode.commands.registerCommand("extension.memoAdmin", () => {
      void openAdmin(context);
    }),
    vscode.commands.registerCommand("extension.memoAutoTag", async () => {
      await autoTagMemoCommand();
    }),
    vscode.commands.registerCommand("extension.memoSummarize", async () => {
      await summarizeMemoCommand();
    }),
    vscode.commands.registerCommand("extension.memoGenerateTitle", async () => {
      await generateAiTitleCommand();
    }),
    vscode.commands.registerCommand("extension.memoProofread", async () => {
      await proofreadMemoCommand();
    }),
    vscode.commands.registerCommand("extension.memoTranslate", async () => {
      await translateMemoCommand();
    }),
    vscode.commands.registerCommand("extension.memoQA", async () => {
      await askMemoQuestionCommand();
    }),
    vscode.commands.registerCommand("extension.memoSuggestTemplate", async () => {
      await suggestTemplateCommand();
    }),
    vscode.commands.registerCommand("extension.memoReport", async () => {
      await reportMemoCommand();
    }),
    vscode.commands.registerCommand("extension.memoLinkSuggest", async () => {
      await linkSuggestCommand();
    }),
    vscode.commands.registerCommand("extension.memoSetAiApiKey", async () => {
      await setAiApiKeyCommand();
    }),
    vscode.commands.registerCommand("extension.memoClearAiApiKey", async () => {
      await clearAiApiKeyCommand();
    })
  );
}
