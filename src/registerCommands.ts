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
import { alignSelectedCsvCommand } from "./features/commands/alignSelectedCsvCommand";
import { formatMarkdownTableCommand } from "./features/commands/formatMarkdownTableCommand";
import { insertFootnoteCommand } from "./features/commands/insertFootnoteCommand";
import { insertMemoLinkCommand } from "./features/commands/insertMemoLinkCommand";
import { listMemos } from "./features/commands/listMemosCommand";
import { listTagsCommand } from "./features/commands/listTagsCommand";
import { openOrCreateWikiMemoCommand } from "./features/commands/openOrCreateWikiMemoCommand";
import { showBacklinksCommand } from "./features/commands/showBacklinksCommand";
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
import { openCustomPagePicker } from "./features/pages/openCustomPageCommand";
import { openSetup } from "./features/setup/openSetupCommand";
import { logMemoBoxError, showMemoBoxAiLogs, showMemoBoxLogs } from "./shared/logging";

// eslint-disable-next-line no-unused-vars
type CommandHandler = (...args: unknown[]) => unknown | Promise<unknown>;

interface CommandRegistration {
  readonly command: string;
  readonly handler: CommandHandler;
}

export function registerCommands(context: vscode.ExtensionContext): void {
  const registrations: readonly CommandRegistration[] = [
    { command: "memobox.newMemo", handler: async () => await newMemo() },
    { command: "memobox.quickMemo", handler: async () => await quickMemo() },
    { command: "memobox.listMemos", handler: async () => await listMemos() },
    { command: "memobox.listTags", handler: async () => await listTagsCommand() },
    { command: "memobox.insertMemoLink", handler: async () => await insertMemoLinkCommand() },
    { command: "memobox.showBacklinks", handler: async () => await showBacklinksCommand() },
    { command: "memobox.openOrCreateWikiMemo", handler: async () => await openOrCreateWikiMemoCommand() },
    { command: "memobox.alignSelectedCsv", handler: async () => await alignSelectedCsvCommand() },
    { command: "memobox.formatMarkdownTable", handler: async () => await formatMarkdownTableCommand() },
    { command: "memobox.insertFootnote", handler: async () => await insertFootnoteCommand() },
    { command: "memobox.createWorkspace", handler: async () => await createWorkspaceCommand() },
    { command: "memobox.grepMemos", handler: async () => await grepMemosCommand() },
    { command: "memobox.todoMemos", handler: async () => await todoMemosCommand() },
    { command: "memobox.relatedMemos", handler: async () => await relatedMemosCommand() },
    { command: "memobox.redateMemo", handler: async () => await redateMemoCommand() },
    { command: "memobox.refreshIndex", handler: async () => await refreshIndexCommand() },
    { command: "memobox.rebuildIndex", handler: async () => await rebuildIndexCommand() },
    { command: "memobox.clearIndexCache", handler: async () => await clearIndexCacheCommand() },
    { command: "memobox.openMemoFolder", handler: async () => await openMemoFolderCommand() },
    { command: "memobox.openMarkdownInBrowser", handler: async () => await openMarkdownInBrowserCommand() },
    { command: "memobox.openCommandLauncher", handler: async () => await openCommandLauncherCommand() },
    { command: "memobox.openSettings", handler: async () => await openSettingsCommand() },
    { command: "memobox.showLogs", handler: () => showMemoBoxLogs() },
    { command: "memobox.showAiLogs", handler: () => showMemoBoxAiLogs() },
    { command: "memobox.openAdmin", handler: async () => await openAdmin(context) },
    { command: "memobox.openSetup", handler: async () => await openSetup(context) },
    { command: "memobox.openCustomPage", handler: async () => await openCustomPagePicker(context) },
    { command: "memobox.aiAutoTag", handler: async () => await autoTagMemoCommand() },
    { command: "memobox.aiSummarize", handler: async () => await summarizeMemoCommand() },
    { command: "memobox.aiGenerateTitle", handler: async () => await generateAiTitleCommand() },
    { command: "memobox.aiProofread", handler: async () => await proofreadMemoCommand() },
    { command: "memobox.aiTranslate", handler: async () => await translateMemoCommand() },
    { command: "memobox.aiQuestion", handler: async () => await askMemoQuestionCommand() },
    { command: "memobox.aiSuggestTemplate", handler: async () => await suggestTemplateCommand() },
    { command: "memobox.aiReport", handler: async () => await reportMemoCommand() },
    { command: "memobox.aiLinkSuggest", handler: async () => await linkSuggestCommand() },
    { command: "memobox.aiSetApiKey", handler: async () => await setAiApiKeyCommand() },
    { command: "memobox.aiClearApiKey", handler: async () => await clearAiApiKeyCommand() },
    { command: "extension.memoNew", handler: async () => await newMemo() },
    { command: "extension.memoQuick", handler: async () => await quickMemo() },
    { command: "extension.memoEdit", handler: async () => await listMemos() },
    { command: "extension.memoGrep", handler: async () => await grepMemosCommand() },
    { command: "extension.memoConfig", handler: async () => await openSettingsCommand() },
    { command: "extension.memoReDate", handler: async () => await redateMemoCommand() },
    { command: "extension.memoTodo", handler: async () => await todoMemosCommand() },
    { command: "extension.memoRelated", handler: async () => await relatedMemosCommand() },
    { command: "extension.memoInsertLink", handler: async () => await insertMemoLinkCommand() },
    { command: "extension.memoBacklinks", handler: async () => await showBacklinksCommand() },
    { command: "extension.memoOpenOrCreateWikiMemo", handler: async () => await openOrCreateWikiMemoCommand() },
    { command: "extension.memoAlignSelectedCsv", handler: async () => await alignSelectedCsvCommand() },
    { command: "extension.memoFormatMarkdownTable", handler: async () => await formatMarkdownTableCommand() },
    { command: "extension.memoInsertFootnote", handler: async () => await insertFootnoteCommand() },
    { command: "extension.memoOpenFolder", handler: async () => await openMemoFolderCommand() },
    { command: "extension.memoOpenChrome", handler: async () => await openMarkdownInBrowserCommand() },
    { command: "extension.memoAdmin", handler: async () => await openAdmin(context) },
    { command: "extension.memoAutoTag", handler: async () => await autoTagMemoCommand() },
    { command: "extension.memoSummarize", handler: async () => await summarizeMemoCommand() },
    { command: "extension.memoGenerateTitle", handler: async () => await generateAiTitleCommand() },
    { command: "extension.memoProofread", handler: async () => await proofreadMemoCommand() },
    { command: "extension.memoTranslate", handler: async () => await translateMemoCommand() },
    { command: "extension.memoQA", handler: async () => await askMemoQuestionCommand() },
    { command: "extension.memoSuggestTemplate", handler: async () => await suggestTemplateCommand() },
    { command: "extension.memoReport", handler: async () => await reportMemoCommand() },
    { command: "extension.memoLinkSuggest", handler: async () => await linkSuggestCommand() },
    { command: "extension.memoSetAiApiKey", handler: async () => await setAiApiKeyCommand() },
    { command: "extension.memoClearAiApiKey", handler: async () => await clearAiApiKeyCommand() }
  ];

  context.subscriptions.push(
    ...registrations.map(({ command, handler }) => registerMemoBoxCommand(command, handler))
  );
}

function registerMemoBoxCommand(command: string, handler: CommandHandler): vscode.Disposable {
  return vscode.commands.registerCommand(command, async (...args: unknown[]) => {
    try {
      await handler(...args);
    } catch (error) {
      const message = getErrorMessage(error);
      logMemoBoxError("command", `Command failed: ${command}`, { message });
      await vscode.window.showErrorMessage(formatCommandErrorMessage(command, message));
    }
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.trim();
  }

  return String(error).trim();
}

function formatCommandErrorMessage(command: string, message: string): string {
  const detail = message === "" ? "" : ` ${message}`;
  return `MemoBox: Command failed (${command}).${detail}`;
}
