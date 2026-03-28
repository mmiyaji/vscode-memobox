import * as vscode from "vscode";

import { readSettings } from "./core/config/settings";
import {
  clearMemoIndexCache,
  noteMemoIndexFileDelete,
  noteMemoIndexFileRename,
  noteMemoIndexFileUpsert
} from "./core/index/memoIndex";
import { initializeMemoBoxAiSecrets } from "./infra/ai/secrets";
import { applyMemoBoxAiContextKeys } from "./infra/ai/contextKeys";
import { initializeMemoBoxLogging, logMemoBoxInfo } from "./shared/logging";
import { initializeMemoBoxWebviewTemplates } from "./shared/webviewTemplate";
import { openAdmin } from "./features/admin/openAdminCommand";
import { openSetup } from "./features/setup/openSetupCommand";
import { MemoLinkCompletionProvider } from "./features/links/memoLinkCompletionProvider";
import { MemoLinkSuggestTrigger } from "./features/links/memoLinkSuggestTrigger";
import { MemoSlashCommandProvider } from "./features/markdown/memoSlashCommandProvider";
import { MemoSnippetProvider } from "./features/snippets/memoSnippetProvider";
import { isReadyMemoRoot } from "./features/welcome/setupFlow";
import { registerCommands } from "./registerCommands";

export function activate(context: vscode.ExtensionContext): void {
  initializeMemoBoxWebviewTemplates(context.extensionPath);
  initializeMemoBoxAiSecrets(context.secrets);
  const memoLogChannel = vscode.window.createOutputChannel("MemoBox");
  const memoAiLogChannel = vscode.window.createOutputChannel("MemoBox AI");
  initializeMemoBoxLogging({
    generalChannel: memoLogChannel,
    aiChannel: memoAiLogChannel,
    getLogLevel: () => readSettings().logLevel
  });
  registerCommands(context);

  const snippetProvider = new MemoSnippetProvider(() => readSettings());
  const memoLinkCompletionProvider = new MemoLinkCompletionProvider(() => readSettings());
  const memoLinkSuggestTrigger = new MemoLinkSuggestTrigger();
  const memoSlashCommandProvider = new MemoSlashCommandProvider(snippetProvider);
  void applyMemoBoxAiContextKeys();

  context.subscriptions.push(
    memoLogChannel,
    memoAiLogChannel,
    snippetProvider,
    memoLinkCompletionProvider,
    memoLinkSuggestTrigger,
    memoSlashCommandProvider,
    vscode.languages.registerCompletionItemProvider({ language: "markdown" }, snippetProvider),
    vscode.languages.registerCompletionItemProvider({ language: "markdown" }, memoLinkCompletionProvider, "[", "]", "(", "/"),
    vscode.languages.registerCompletionItemProvider({ language: "markdown" }, memoSlashCommandProvider, "/"),
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.uri.scheme === "file") {
        noteMemoIndexFileUpsert(document.uri.fsPath);
      }
    }),
    vscode.workspace.onDidCreateFiles((event) => {
      for (const file of event.files) {
        if (file.scheme === "file") {
          noteMemoIndexFileUpsert(file.fsPath);
        }
      }
    }),
    vscode.workspace.onDidDeleteFiles((event) => {
      for (const file of event.files) {
        if (file.scheme === "file") {
          noteMemoIndexFileDelete(file.fsPath);
        }
      }
    }),
    vscode.workspace.onDidRenameFiles((event) => {
      for (const rename of event.files) {
        if (rename.oldUri.scheme === "file" && rename.newUri.scheme === "file") {
          noteMemoIndexFileRename(rename.oldUri.fsPath, rename.newUri.fsPath);
          continue;
        }

        if (rename.oldUri.scheme === "file") {
          noteMemoIndexFileDelete(rename.oldUri.fsPath);
        }

        if (rename.newUri.scheme === "file") {
          noteMemoIndexFileUpsert(rename.newUri.fsPath);
        }
      }
    }),
    context.secrets.onDidChange(() => {
      void applyMemoBoxAiContextKeys();
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("memobox.aiEnabled") || event.affectsConfiguration("memobox.ai")) {
        void applyMemoBoxAiContextKeys();
      }

      if (
        event.affectsConfiguration("memobox.memodir") ||
        event.affectsConfiguration("memobox.metaDir") ||
        event.affectsConfiguration("memobox.snippetsDir") ||
        event.affectsConfiguration("memobox.memoSnippetsDir")
      ) {
        void snippetProvider.reload();
      }

      if (
        event.affectsConfiguration("memobox.memodir") ||
        event.affectsConfiguration("memobox.metaDir") ||
        event.affectsConfiguration("memobox.listDisplayExtname") ||
        event.affectsConfiguration("memobox.maxScanDepth") ||
        event.affectsConfiguration("memobox.excludeDirectories")
      ) {
        clearMemoIndexCache();
      }
    })
  );

  const settings = readSettings();
  logMemoBoxInfo("extension", "MemoBox activated.", {
    adminOpenOnStartup: settings.adminOpenOnStartup,
    aiEnabled: settings.aiEnabled
  });
  void isReadyMemoRoot(settings.memodir).then((ready) => {
    if (!ready) {
      setTimeout(() => {
        openSetup(context);
      }, 500);
      return;
    }

    if (!settings.adminOpenOnStartup) {
      return;
    }

    setTimeout(() => {
      openAdmin(context);
    }, 400);
  });
}

export function deactivate(): void {
  // No-op for the scaffold stage.
}
