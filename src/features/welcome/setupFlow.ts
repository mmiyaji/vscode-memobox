import * as vscode from "vscode";
import { mkdir, stat } from "node:fs/promises";
import type { MemoBoxSettings } from "../../core/config/types";
import { ensureMemoMetaDirectories } from "../../core/meta/memoAssets";
import { clearMemoIndexCache } from "../../core/index/memoIndex";
import { assessMemoRootScope } from "../../core/memo/memoRootGuard";
import { getGlobalConfigurationTarget } from "../../shared/configTarget";
import { getMemoBoxUiText, resolveUiLanguage } from "../../shared/uiText";
import { getRecommendedMemoRoot } from "./recommendedMemoRoot";

export async function pickMemoRootFromDialog(): Promise<string | undefined> {
  const result = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Use This Folder",
    title: "MemoBox: Select Memo Root"
  });

  return result?.[0]?.fsPath;
}

export async function completeMemoBoxSetup(
  settings: MemoBoxSettings,
  requestedMemoRoot?: string
): Promise<string | undefined> {
  const memoRoot = (requestedMemoRoot ?? settings.memodir).trim() || getRecommendedMemoRoot();
  if (!(await confirmBroadMemoRoot(settings, memoRoot))) {
    return undefined;
  }

  await mkdir(memoRoot, { recursive: true });
  await vscode.workspace.getConfiguration("memobox").update("memodir", memoRoot, getGlobalConfigurationTarget());

  const nextSettings: MemoBoxSettings = {
    ...settings,
    memodir: memoRoot
  };

  await ensureMemoMetaDirectories(nextSettings);
  clearMemoIndexCache();
  return memoRoot;
}

export async function isReadyMemoRoot(directoryPath: string): Promise<boolean> {
  const normalized = directoryPath.trim();
  if (normalized === "") {
    return false;
  }

  try {
    const info = await stat(normalized);
    return info.isDirectory();
  } catch {
    return false;
  }
}

async function confirmBroadMemoRoot(settings: MemoBoxSettings, memoRoot: string): Promise<boolean> {
  const assessment = assessMemoRootScope(memoRoot);
  if (!assessment.isSuspicious) {
    return true;
  }

  const ui = getMemoBoxUiText(resolveUiLanguage(settings.locale));
  const confirmation = await vscode.window.showWarningMessage(
    ui.setup.broadRootConfirmTitle,
    {
      modal: true,
      detail: ui.setup.broadRootConfirmDetail(memoRoot)
    },
    ui.setup.broadRootConfirmAction
  );

  return confirmation === ui.setup.broadRootConfirmAction;
}
