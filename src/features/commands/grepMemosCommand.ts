import * as vscode from "vscode";
import { grepMemos } from "../../core/memo/grepMemos";
import { buildGrepResultsText } from "../../core/memo/grepRender";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import type { MemoTextMatch } from "../../core/memo/textMatch";
import { openLocatedMatch, showLocatedMatchQuickPick } from "./locatedMatchQuickPick";
import { pickMemoSearchScope } from "./pickMemoSearchScope";

const grepOutputChannel = vscode.window.createOutputChannel("MemoBox Grep");
const grepDocumentScheme = "memobox-grep";
const grepContentProvider = new (class implements vscode.TextDocumentContentProvider {
  private readonly contents = new Map<string, string>();

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.contents.get(uri.toString()) ?? "";
  }

  set(uri: vscode.Uri, content: string): void {
    this.contents.set(uri.toString(), content);
  }
})();
let grepContentProviderRegistration: vscode.Disposable | undefined;

export async function grepMemosCommand(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  const indexedEntries = await getMemoIndexEntries(settings);
  const scope = await pickMemoSearchScope(indexedEntries);
  if (!scope) {
    return;
  }

  const query = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: "Enter a search query"
  });

  const trimmedQuery = query?.trim() ?? "";
  if (trimmedQuery === "") {
    return;
  }

  const searchResult = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
      title: `MemoBox: Grep (${scope.label})`
    },
    async (_, token) =>
      await grepMemos(settings, trimmedQuery, scope.scope, {
        maxResults: settings.searchMaxResults,
        isCancellationRequested: () => token.isCancellationRequested
      })
  );

  if (searchResult.cancelled) {
    await vscode.window.showInformationMessage("MemoBox: Grep was cancelled.");
    return;
  }

  const { matches } = searchResult;
  if (matches.length === 0) {
    await vscode.window.showInformationMessage("MemoBox: No grep results found.");
    return;
  }

  if (searchResult.truncated) {
    await vscode.window.showInformationMessage(`MemoBox: Grep results were limited to ${settings.searchMaxResults} matches.`);
  }

  if (settings.grepViewMode === "outputChannel" || settings.grepViewMode === "both") {
    showResultsInOutputChannel(trimmedQuery, scope.label, matches);
    if (settings.grepViewMode === "outputChannel") {
      return;
    }
  }

  if (settings.grepViewMode === "readOnlyDocument") {
    await showResultsInReadOnlyDocument(trimmedQuery, scope.label, matches);
    return;
  }

  if (settings.grepViewMode === "editableDocument") {
    await showResultsInEditableDocument(trimmedQuery, scope.label, matches);
    return;
  }

  const selected = await showResultsInQuickPick(trimmedQuery, scope.label, matches);

  if (!selected) {
    return;
  }

  await openLocatedMatch(selected, {
    preview: true,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.One
  }, settings);
}

function showResultsInQuickPick(
  query: string,
  scopeLabel: string,
  matches: readonly MemoTextMatch[]
) {
  return showLocatedMatchQuickPick(
    matches.map((match, index) => ({
      label: `${index + 1} - Ln:${match.lineNumber} Col:${match.columnNumber}`,
      description: match.lineText,
      detail: match.relativePath,
      absolutePath: match.absolutePath,
      lineNumber: match.lineNumber,
      columnNumber: match.columnNumber,
      matchLength: query.length
    })),
    `grep Result: ${query} (${matches.length}) [${scopeLabel}]`
  );
}

function showResultsInOutputChannel(
  query: string,
  scopeLabel: string,
  matches: readonly MemoTextMatch[]
): void {
  grepOutputChannel.clear();
  grepOutputChannel.appendLine(`Query: ${query}`);
  grepOutputChannel.appendLine(`Scope: ${scopeLabel}`);
  grepOutputChannel.appendLine(`Results: ${matches.length}`);
  grepOutputChannel.appendLine("");

  for (const match of matches) {
    grepOutputChannel.appendLine(`${match.relativePath}:${match.lineNumber}:${match.columnNumber} ${match.lineText}`);
  }

  grepOutputChannel.show(true);
}

async function showResultsInReadOnlyDocument(
  query: string,
  scopeLabel: string,
  matches: readonly MemoTextMatch[]
): Promise<void> {
  ensureGrepContentProvider();

  const uri = vscode.Uri.parse(`${grepDocumentScheme}:MemoBox%20Grep%20${Date.now()}.md`);
  grepContentProvider.set(uri, buildGrepResultsText(query, scopeLabel, matches));
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document, {
    preview: false,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.Active
  });
}

async function showResultsInEditableDocument(
  query: string,
  scopeLabel: string,
  matches: readonly MemoTextMatch[]
): Promise<void> {
  const document = await vscode.workspace.openTextDocument({
    content: buildGrepResultsText(query, scopeLabel, matches),
    language: "markdown"
  });
  await vscode.window.showTextDocument(document, {
    preview: false,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.Active
  });
}

function ensureGrepContentProvider(): void {
  if (grepContentProviderRegistration) {
    return;
  }

  grepContentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(
    grepDocumentScheme,
    grepContentProvider
  );
}
