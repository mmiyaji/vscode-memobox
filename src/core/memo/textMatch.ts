export interface MemoTextMatch {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly lineNumber: number;
  readonly columnNumber: number;
  readonly lineText: string;
  readonly matchLength: number;
}
