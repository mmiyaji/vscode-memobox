import { homedir } from "node:os";
import { join, normalize, parse, resolve } from "node:path";

export type MemoRootRiskCode = "filesystemRoot" | "home" | "documents" | "desktop" | "downloads";

export interface MemoRootAssessment {
  readonly normalizedPath: string;
  readonly riskCodes: readonly MemoRootRiskCode[];
  readonly isSuspicious: boolean;
}

export function formatMemoRootRiskCodes(riskCodes: readonly MemoRootRiskCode[]): readonly string[] {
  return riskCodes.map((riskCode) => {
    switch (riskCode) {
      case "filesystemRoot":
        return "Drive root";
      case "home":
        return "Home";
      case "documents":
        return "Documents";
      case "desktop":
        return "Desktop";
      case "downloads":
        return "Downloads";
      default:
        return riskCode;
    }
  });
}

export function assessMemoRootScope(directoryPath: string): MemoRootAssessment {
  const trimmedPath = directoryPath.trim();
  const normalizedPath = trimmedPath === "" ? "" : normalize(resolve(trimmedPath));

  if (normalizedPath === "") {
    return {
      normalizedPath,
      riskCodes: [],
      isSuspicious: false
    };
  }

  const homePath = normalize(resolve(homedir()));
  const documentsPath = normalize(join(homePath, "Documents"));
  const desktopPath = normalize(join(homePath, "Desktop"));
  const downloadsPath = normalize(join(homePath, "Downloads"));
  const filesystemRoot = normalize(parse(normalizedPath).root);
  const riskCodes: MemoRootRiskCode[] = [];

  if (normalizedPath === filesystemRoot) {
    riskCodes.push("filesystemRoot");
  }

  if (normalizedPath === homePath) {
    riskCodes.push("home");
  }

  if (normalizedPath === documentsPath) {
    riskCodes.push("documents");
  }

  if (normalizedPath === desktopPath) {
    riskCodes.push("desktop");
  }

  if (normalizedPath === downloadsPath) {
    riskCodes.push("downloads");
  }

  return {
    normalizedPath,
    riskCodes,
    isSuspicious: riskCodes.length > 0
  };
}
