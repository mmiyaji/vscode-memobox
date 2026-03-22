export function getExtensionDisplayVersion(rawVersion: string | undefined): string {
  if (!rawVersion || rawVersion.trim() === "") {
    return "0.0.0";
  }

  return rawVersion.trim();
}
