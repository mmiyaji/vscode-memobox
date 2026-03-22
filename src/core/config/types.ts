export type MemoBoxLocale = "auto" | "ja" | "en";
export type MemoListSortOrder = "filename" | "mtime" | "birthtime";
export type MemoGrepViewMode = "quickPick" | "outputChannel" | "both" | "readOnlyDocument" | "editableDocument";

export interface MemoBoxSettings {
  readonly memodir: string;
  readonly datePathFormat: string;
  readonly memotemplate: string;
  readonly metaDir: string;
  readonly templatesDir: string;
  readonly snippetsDir: string;
  readonly searchMaxResults: number;
  readonly relatedMemoLimit: number;
  readonly listSortOrder: MemoListSortOrder;
  readonly listDisplayExtname: readonly string[];
  readonly displayFileBirthTime: boolean;
  readonly openMarkdownPreview: boolean;
  readonly grepViewMode: MemoGrepViewMode;
  readonly todoPattern: string;
  readonly recentCount: number;
  readonly adminOpenOnStartup: boolean;
  readonly titlePrefix: string;
  readonly dateFormat: string;
  readonly memoNewFilenameFromClipboard: boolean;
  readonly memoNewFilenameFromSelection: boolean;
  readonly memoNewFilenameDateSuffix: string;
  readonly locale: MemoBoxLocale;
}
