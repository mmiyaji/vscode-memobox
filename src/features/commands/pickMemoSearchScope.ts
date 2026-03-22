import * as vscode from "vscode";
import { createDefaultGrepScopes, listIndexedDirectories, type MemoGrepScopeOption } from "../../core/memo/grepScopes";

export async function pickMemoSearchScope(
  indexedEntries: readonly { relativePath: string }[]
): Promise<MemoGrepScopeOption | undefined> {
  const defaultScopes = createDefaultGrepScopes();
  const selected = await vscode.window.showQuickPick(
    [
      ...defaultScopes,
      {
        label: "Choose subfolder",
        description: "Limit search to one indexed folder",
        scope: { kind: "all" } as const
      }
    ],
    {
      ignoreFocusOut: true,
      placeHolder: "Choose the search scope"
    }
  );

  if (!selected) {
    return undefined;
  }

  if (selected.label !== "Choose subfolder") {
    return selected;
  }

  const directories = listIndexedDirectories(indexedEntries);
  if (directories.length === 0) {
    await vscode.window.showInformationMessage("MemoBox: No subfolders are available for scoped search.");
    return undefined;
  }

  const pickedDirectory = await vscode.window.showQuickPick(
    directories.map((directory) => ({
      label: directory,
      description: "Search only this folder",
      scope: { kind: "subfolder", prefix: `${directory}/` } as const
    })),
    {
      ignoreFocusOut: true,
      placeHolder: "Choose a subfolder"
    }
  );

  return pickedDirectory;
}
