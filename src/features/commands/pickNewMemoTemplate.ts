import * as vscode from "vscode";
import {
  buildNewMemoTemplateSelectionPlan,
  listTemplateAssets,
  type NewMemoTemplateSelectionOption
} from "../../core/meta/memoAssets";
import type { MemoBoxSettings } from "../../core/config/types";
import { areSameMemoPaths } from "../../core/memo/pathing";

export interface PickNewMemoTemplateResult {
  readonly cancelled: boolean;
  readonly templatePath?: string;
}

export async function pickNewMemoTemplate(settings: MemoBoxSettings): Promise<PickNewMemoTemplateResult> {
  const templates = await listTemplateAssets(settings);
  const plan = buildNewMemoTemplateSelectionPlan(settings, templates);

  if (plan.mode === "template") {
    return {
      cancelled: false,
      templatePath: plan.templatePath
    };
  }

  if (plan.mode !== "pick") {
    return { cancelled: false };
  }

  const picked = await vscode.window.showQuickPick(
    plan.options.map((option) => ({
      label: option.kind === "default" ? option.name : option.name.replace(/\.md$/i, ""),
      description: buildOptionDescription(option),
      detail: buildOptionDetail(option, settings, templates),
      option
    })),
    {
      ignoreFocusOut: true,
      placeHolder: "Select a template for the new memo"
    }
  );

  if (!picked) {
    return { cancelled: true };
  }

  if (picked.option.kind === "default") {
    return { cancelled: false };
  }

  return {
    cancelled: false,
    templatePath: picked.option.absolutePath
  };
}

function buildOptionDescription(option: NewMemoTemplateSelectionOption): string {
  if (option.kind === "default") {
    return option.isDefault ? "Current default" : "";
  }

  return option.isDefault ? `${option.name} | current default` : option.name;
}

function buildOptionDetail(
  option: NewMemoTemplateSelectionOption,
  settings: Pick<MemoBoxSettings, "memotemplate">,
  templates: readonly { absolutePath: string }[]
): string {
  if (option.kind === "default") {
    if (settings.memotemplate.trim() !== "" && option.absolutePath) {
      return option.absolutePath;
    }

    return templates.some((template) => option.absolutePath && areSameMemoPaths(template.absolutePath, option.absolutePath))
      ? option.absolutePath ?? "Built-in template"
      : "Built-in template";
  }

  return option.absolutePath ?? option.name;
}
