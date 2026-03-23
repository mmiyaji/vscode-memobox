import type { MemoBoxSettings } from "../../core/config/types";
import { assessMemoRootScope, type MemoRootRiskCode } from "../../core/memo/memoRootGuard";
import { getDefaultWorkspaceName, getMemoWorkspaceFilePath } from "../../core/meta/memoWorkspace";
import { getRecommendedMemoRoot } from "../welcome/recommendedMemoRoot";

export interface SetupViewModel {
  readonly version: string;
  readonly memoRoot: string;
  readonly memoRootConfigured: boolean;
  readonly memoRootReady: boolean;
  readonly suggestedMemoRoot: string;
  readonly recommendedMemoRoot: string;
  readonly setupTargetPath: string;
  readonly metaDir: string;
  readonly workspaceFilePath: string;
  readonly workspaceFileExists: boolean;
  readonly memoRootLooksBroad: boolean;
  readonly memoRootRiskCodes: readonly MemoRootRiskCode[];
}

export function buildSetupViewModel(
  settings: Pick<MemoBoxSettings, "memodir" | "metaDir">,
  version: string,
  workspaceFileExists: boolean
): SetupViewModel {
  const suggestedMemoRoot = getRecommendedMemoRoot();
  const memoRoot = settings.memodir.trim();
  const setupTargetPath = memoRoot || suggestedMemoRoot;
  const workspaceFilePath =
    setupTargetPath === ""
      ? ""
      : getMemoWorkspaceFilePath(setupTargetPath, `${getDefaultWorkspaceName()}.code-workspace`);
  const memoRootAssessment = assessMemoRootScope(setupTargetPath);

  return {
    version,
    memoRoot,
    memoRootConfigured: memoRoot !== "",
    memoRootReady: memoRoot !== "",
    suggestedMemoRoot,
    recommendedMemoRoot: suggestedMemoRoot,
    setupTargetPath,
    metaDir: settings.metaDir,
    workspaceFilePath,
    workspaceFileExists,
    memoRootLooksBroad: memoRootAssessment.isSuspicious,
    memoRootRiskCodes: memoRootAssessment.riskCodes
  };
}
