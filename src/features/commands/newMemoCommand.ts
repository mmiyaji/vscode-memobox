import * as vscode from "vscode";
import { access, writeFile } from "node:fs/promises";
import { readSettings } from "../../core/config/settings";
import { ensureMemoDateDirectory, getMemoFilePath } from "../../core/memo/pathing";
import { buildNewMemoContent } from "../../core/memo/template";
import { ensureMemoRoot, getNewMemoSeedText } from "../../core/memo/workspace";
import { buildNewMemoInputPlaceholder } from "./newMemoInput";
import { openMemoDocument } from "./openMemoDocument";
import { pickNewMemoTemplate } from "./pickNewMemoTemplate";

export async function newMemo(): Promise<void> {
  const settings = readSettings();
  const memoRoot = await ensureMemoRoot(settings);

  if (!memoRoot) {
    return;
  }

  const now = new Date();
  const title = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: buildNewMemoInputPlaceholder(settings, now),
    value: await getNewMemoSeedText(settings)
  });

  if (title === undefined) {
    return;
  }

  await ensureMemoDateDirectory(settings, now);

  const filePath = getMemoFilePath(settings, now, title);
  const alreadyExists = await fileExists(filePath);

  if (!alreadyExists) {
    const templateSelection = await pickNewMemoTemplate(settings);
    if (templateSelection.cancelled) {
      return;
    }

    const content = await buildNewMemoContent(settings, title, now, templateSelection.templatePath);
    await writeFile(filePath, content, "utf8");
  }

  const editor = await openMemoDocument(filePath, settings, {
    preview: true,
    preserveFocus: false,
    viewColumn: vscode.ViewColumn.One
  });

  const document = editor.document;
  const endPosition = document.positionAt(document.getText().length);
  editor.selection = new vscode.Selection(endPosition, endPosition);
  editor.revealRange(new vscode.Range(endPosition, endPosition));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
