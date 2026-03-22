import * as vscode from "vscode";
import { stat } from "node:fs/promises";
import type { MemoBoxSettings } from "../config/types";
import { buildMemoTitleInput } from "./fileName";

export async function ensureMemoRoot(settings: MemoBoxSettings): Promise<string | undefined> {
  const memodir = settings.memodir.trim();

  if (memodir === "") {
    await showMemoRootError("MemoBox: Set `memobox.memodir` before using memo commands.");
    return undefined;
  }

  try {
    const info = await stat(memodir);
    if (!info.isDirectory()) {
      await showMemoRootError("MemoBox: `memobox.memodir` must point to an existing directory.");
      return undefined;
    }
  } catch {
    await showMemoRootError("MemoBox: `memobox.memodir` does not exist.");
    return undefined;
  }

  return memodir;
}

export function getActiveSelectionText(): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    return "";
  }

  return editor.document.getText(editor.selection);
}

export async function getNewMemoSeedText(settings: MemoBoxSettings): Promise<string> {
  if (settings.memoNewFilenameFromSelection) {
    const selectedText = buildMemoTitleInput(getActiveSelectionText());
    if (selectedText !== "") {
      return selectedText;
    }
  }

  if (settings.memoNewFilenameFromClipboard) {
    return buildMemoTitleInput(await vscode.env.clipboard.readText());
  }

  return buildMemoTitleInput(getActiveSelectionText());
}

async function showMemoRootError(message: string): Promise<void> {
  const action = await vscode.window.showErrorMessage(message, "Open Settings", "Open Setup");

  if (action === "Open Settings") {
    await vscode.commands.executeCommand("memobox.openSettings");
    return;
  }

  if (action === "Open Setup") {
    await vscode.commands.executeCommand("memobox.openSetup");
  }
}
