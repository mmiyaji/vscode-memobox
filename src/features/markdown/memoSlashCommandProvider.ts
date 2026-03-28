import * as vscode from "vscode";
import { readSettings } from "../../core/config/settings";
import { detectSlashCommandContext, getMemoSlashCommands } from "../../core/text/slashCommands";
import { resolveUiLanguage } from "../../shared/uiText";
import type { MemoSnippetProvider } from "../snippets/memoSnippetProvider";

export class MemoSlashCommandProvider implements vscode.CompletionItemProvider, vscode.Disposable {
  private readonly snippetProvider: MemoSnippetProvider;

  constructor(snippetProvider: MemoSnippetProvider) {
    this.snippetProvider = snippetProvider;
  }

  async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.CompletionItem[]> {
    if (document.languageId !== "markdown") {
      return [];
    }

    const settings = readSettings();
    if (!settings.slashCommandsEnabled) {
      return [];
    }

    const language = resolveUiLanguage(settings.locale);
    const snippetDefinitions = await this.snippetProvider.getDefinitions();
    const slashCommands = getMemoSlashCommands(language, snippetDefinitions);
    const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
    const context = detectSlashCommandContext(linePrefix);
    if (!context) {
      return [];
    }

    const normalizedQuery = context.query.trim().toLowerCase();
    const range = new vscode.Range(position.line, context.replaceStartCharacter, position.line, position.character);

    return slashCommands
      .filter((command) => normalizedQuery === "" || command.label.startsWith(normalizedQuery))
      .map((command, index) => {
        const item = new vscode.CompletionItem(
          { label: `/${command.label}`, description: command.detail },
          vscode.CompletionItemKind.Snippet
        );
        item.range = range;
        item.insertText = new vscode.SnippetString(command.snippet);
        item.detail = command.detail;
        item.sortText = String(index).padStart(4, "0");
        item.filterText = `/${command.label}`;
        return item;
      });
  }

  dispose(): void {
    // No-op.
  }
}
