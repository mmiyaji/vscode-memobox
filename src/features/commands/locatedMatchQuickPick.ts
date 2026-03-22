import * as vscode from "vscode";
import type { MemoBoxSettings } from "../../core/config/types";
import { openMemoDocument } from "./openMemoDocument";

export interface LocatedMatchQuickPickItem extends vscode.QuickPickItem {
  readonly absolutePath: string;
  readonly lineNumber: number;
  readonly columnNumber: number;
  readonly matchLength: number;
}

const locatedMatchDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor("editor.findMatchHighlightBackground"),
  borderColor: new vscode.ThemeColor("editor.findMatchBorder"),
  borderRadius: "2px",
  borderStyle: "solid",
  borderWidth: "1px"
});

export async function showLocatedMatchQuickPick(
  items: readonly LocatedMatchQuickPickItem[],
  placeholder: string
): Promise<LocatedMatchQuickPickItem | undefined> {
  const previewController = new LocatedMatchPreviewController();
  const quickPick = vscode.window.createQuickPick<LocatedMatchQuickPickItem>();

  quickPick.items = items;
  quickPick.ignoreFocusOut = true;
  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;
  quickPick.placeholder = placeholder;

  return await new Promise<LocatedMatchQuickPickItem | undefined>((resolve) => {
    let resolved = false;

    const settle = (item: LocatedMatchQuickPickItem | undefined): void => {
      if (resolved) {
        return;
      }

      resolved = true;
      previewController.dispose();
      quickPick.dispose();
      resolve(item);
    };

    quickPick.onDidChangeActive((activeItems) => {
      const activeItem = activeItems[0];
      if (!activeItem) {
        return;
      }

      void previewController.preview(activeItem);
    });

    quickPick.onDidAccept(() => {
      settle(quickPick.selectedItems[0] ?? quickPick.activeItems[0]);
    });

    quickPick.onDidHide(() => {
      settle(undefined);
    });

    quickPick.show();
    if (items[0]) {
      quickPick.activeItems = [items[0]];
      void previewController.preview(items[0]);
    }
  });
}

export async function openLocatedMatch(
  item: Pick<LocatedMatchQuickPickItem, "absolutePath" | "lineNumber" | "columnNumber" | "matchLength">,
  options: {
    readonly preview: boolean;
    readonly preserveFocus: boolean;
    readonly viewColumn?: vscode.ViewColumn;
  },
  settings?: Pick<MemoBoxSettings, "openMarkdownPreview">
): Promise<vscode.TextEditor> {
  const editor = await openMemoDocument(item.absolutePath, settings ?? { openMarkdownPreview: false }, {
    preview: options.preview,
    preserveFocus: options.preserveFocus,
    viewColumn: options.viewColumn ?? vscode.ViewColumn.One
  });

  const range = createMatchRange(item);
  editor.selection = new vscode.Selection(range.start, range.end);
  editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  return editor;
}

class LocatedMatchPreviewController implements vscode.Disposable {
  private activeRequest = 0;
  private previewEditor: vscode.TextEditor | undefined;

  async preview(item: LocatedMatchQuickPickItem): Promise<void> {
    const requestId = this.activeRequest + 1;
    this.activeRequest = requestId;

    const document = await vscode.workspace.openTextDocument(item.absolutePath);
    if (requestId !== this.activeRequest) {
      return;
    }

    const editor = await vscode.window.showTextDocument(document, {
      preview: true,
      preserveFocus: true,
      viewColumn: vscode.ViewColumn.Active
    });
    if (requestId !== this.activeRequest) {
      return;
    }

    this.clearDecorations();
    this.previewEditor = editor;

    const range = createMatchRange(item);
    editor.setDecorations(locatedMatchDecorationType, [range]);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }

  dispose(): void {
    this.activeRequest += 1;
    this.clearDecorations();
  }

  private clearDecorations(): void {
    this.previewEditor?.setDecorations(locatedMatchDecorationType, []);
    this.previewEditor = undefined;
  }
}

function createMatchRange(
  item: Pick<LocatedMatchQuickPickItem, "lineNumber" | "columnNumber" | "matchLength">
): vscode.Range {
  const start = new vscode.Position(item.lineNumber - 1, item.columnNumber - 1);
  const end = new vscode.Position(item.lineNumber - 1, item.columnNumber - 1 + item.matchLength);
  return new vscode.Range(start, end);
}
