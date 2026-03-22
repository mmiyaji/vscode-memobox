import * as vscode from "vscode";
import { getMemoCommandLauncherDescriptors } from "./commandLauncherItems";

interface MemoCommandLauncherItem extends vscode.QuickPickItem {
  readonly command?: string;
}

export async function openCommandLauncherCommand(): Promise<void> {
  const descriptors = getMemoCommandLauncherDescriptors();
  const items: MemoCommandLauncherItem[] = [];
  let currentGroup: string | undefined;

  for (const descriptor of descriptors) {
    if (descriptor.group !== currentGroup) {
      currentGroup = descriptor.group;
      items.push({
        kind: vscode.QuickPickItemKind.Separator,
        label: descriptor.group
      });
    }

    items.push({
      label: `$(${descriptor.icon}) ${descriptor.label}`,
      detail: descriptor.detail,
      command: descriptor.command
    });
  }

  const selected = await vscode.window.showQuickPick(items, {
    ignoreFocusOut: true,
    matchOnDetail: true,
    placeHolder: "Run a MemoBox command"
  });

  if (!selected?.command) {
    return;
  }

  await vscode.commands.executeCommand(selected.command);
}
