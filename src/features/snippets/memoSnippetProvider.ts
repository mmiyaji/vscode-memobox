import * as vscode from "vscode";
import { existsSync } from "node:fs";
import type { MemoBoxSettings } from "../../core/config/types";
import type { MemoSnippetDefinition } from "../../core/meta/memoAssets";
import { getSnippetsDirectory, listSnippetAssets } from "../../core/meta/memoAssets";

export class MemoSnippetProvider implements vscode.CompletionItemProvider, vscode.Disposable {
  private items: vscode.CompletionItem[] = [];
  private definitions: MemoSnippetDefinition[] = [];
  private watchedDirectory = "";
  private watcher: vscode.FileSystemWatcher | undefined;
  private loading: Promise<void> | undefined;
  private readonly getSettingsFn: () => MemoBoxSettings;

  constructor(getSettings: () => MemoBoxSettings) {
    this.getSettingsFn = getSettings;
  }

  async provideCompletionItems(): Promise<vscode.CompletionItem[]> {
    await this.reloadIfNeeded();
    return [...this.items];
  }

  async getDefinitions(): Promise<readonly MemoSnippetDefinition[]> {
    await this.reloadIfNeeded();
    return [...this.definitions];
  }

  async reload(): Promise<void> {
    const settings = this.getSettingsFn();
    const directory = getSnippetsDirectory(settings);

    this.ensureWatcher(directory);
    const assets = await listSnippetAssets(settings);
    this.definitions = assets.flatMap((asset) => asset.snippets);
    this.items = this.definitions.flatMap((snippet) => toCompletionItems(snippet));
  }

  dispose(): void {
    this.watcher?.dispose();
    this.watcher = undefined;
  }

  private async reloadIfNeeded(): Promise<void> {
    const directory = getSnippetsDirectory(this.getSettingsFn());

    if (directory !== this.watchedDirectory || this.items.length === 0) {
      this.loading ??= this.reload().finally(() => {
        this.loading = undefined;
      });
      await this.loading;
    }
  }

  private ensureWatcher(directory: string): void {
    if (directory === this.watchedDirectory) {
      return;
    }

    this.watcher?.dispose();
    this.watcher = undefined;
    this.watchedDirectory = directory;

    if (directory === "" || !existsSync(directory)) {
      return;
    }

    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(directory, "*.json"));
    const reload = () => {
      this.loading = this.reload().finally(() => {
        this.loading = undefined;
      });
    };
    watcher.onDidCreate(reload);
    watcher.onDidChange(reload);
    watcher.onDidDelete(reload);
    this.watcher = watcher;
  }
}

function toCompletionItems(snippet: {
  readonly name: string;
  readonly prefixes: readonly string[];
  readonly description: string;
  readonly body: string;
}): readonly vscode.CompletionItem[] {
  return snippet.prefixes.map((prefix) => {
    const item = new vscode.CompletionItem(
      { label: prefix, description: snippet.description || snippet.name },
      vscode.CompletionItemKind.Snippet
    );

    item.insertText = new vscode.SnippetString(snippet.body);
    item.detail = snippet.name;
    item.documentation = new vscode.MarkdownString(buildSnippetPreview(snippet.body));
    item.documentation.isTrusted = false;
    return item;
  });
}

function buildSnippetPreview(body: string): string {
  const preview = body.replace(/\$\{\d+:?(.*?)\}/g, "$1").replace(/\$\d+/g, "");
  return `\`\`\`markdown\n${preview}\n\`\`\``;
}
