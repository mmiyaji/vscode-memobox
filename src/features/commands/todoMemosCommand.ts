import * as vscode from "vscode";
import { getMemoIndexEntries } from "../../core/index/memoIndex";
import { readSettings } from "../../core/config/settings";
import { ensureMemoRoot } from "../../core/memo/workspace";
import { createTodoRegExp, findTodoMemos } from "../../core/memo/todoMemos";
import { openLocatedMatch, showLocatedMatchQuickPick, type LocatedMatchQuickPickItem } from "./locatedMatchQuickPick";
import { pickMemoSearchScope } from "./pickMemoSearchScope";

export async function todoMemosCommand(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  try {
    createTodoRegExp(settings.todoPattern);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await vscode.window.showErrorMessage(`MemoBox: Invalid todoPattern setting. ${message}`);
    return;
  }

  const indexedEntries = await getMemoIndexEntries(settings);
  const scope = await pickMemoSearchScope(indexedEntries);
  if (!scope) {
    return;
  }

  const searchResult = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
      title: `MemoBox: Todo (${scope.label})`
    },
    async (_, token) =>
      await findTodoMemos(settings, scope.scope, {
        maxResults: settings.searchMaxResults,
        isCancellationRequested: () => token.isCancellationRequested
      })
  );

  if (searchResult.cancelled) {
    await vscode.window.showInformationMessage("MemoBox: Todo scan was cancelled.");
    return;
  }

  const { matches } = searchResult;
  if (matches.length === 0) {
    await vscode.window.showInformationMessage("MemoBox: No todo items found.");
    return;
  }

  if (searchResult.truncated) {
    await vscode.window.showInformationMessage(`MemoBox: Todo results were limited to ${settings.searchMaxResults} matches.`);
  }

  const items: LocatedMatchQuickPickItem[] = matches.map((match, index) => ({
    label: `${index + 1} - ${match.lineText || "(blank line)"}`,
    description: `${match.relativePath}:${match.lineNumber}:${match.columnNumber}`,
    detail: "Pattern match",
    absolutePath: match.absolutePath,
    lineNumber: match.lineNumber,
    columnNumber: match.columnNumber,
    matchLength: match.matchLength
  }));

  const selected = await showLocatedMatchQuickPick(items, `Todo Result (${matches.length}) [${scope.label}]`);
  if (!selected) {
    return;
  }

  await openLocatedMatch(selected, {
    preview: true,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.One
  }, settings);
}
