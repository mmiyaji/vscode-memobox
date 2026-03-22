import * as vscode from "vscode";

import { readSettings } from "./core/config/settings";
import { openAdmin } from "./features/admin/openAdminCommand";
import { openSetup } from "./features/setup/openSetupCommand";
import { MemoSnippetProvider } from "./features/snippets/memoSnippetProvider";
import { isReadyMemoRoot } from "./features/welcome/setupFlow";
import { registerCommands } from "./registerCommands";

export function activate(context: vscode.ExtensionContext): void {
  registerCommands(context);

  const snippetProvider = new MemoSnippetProvider(() => readSettings());

  context.subscriptions.push(
    snippetProvider,
    vscode.languages.registerCompletionItemProvider({ language: "markdown" }, snippetProvider),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("memobox.memodir") ||
        event.affectsConfiguration("memobox.metaDir") ||
        event.affectsConfiguration("memobox.snippetsDir") ||
        event.affectsConfiguration("memobox.memoSnippetsDir")
      ) {
        void snippetProvider.reload();
      }
    })
  );

  const settings = readSettings();
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
