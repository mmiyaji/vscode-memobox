import test from "node:test";
import assert from "node:assert/strict";
import { getMemoCommandLauncherDescriptors } from "../src/features/commands/commandLauncherItems";

test("command launcher descriptors are grouped and unique", () => {
  const descriptors = getMemoCommandLauncherDescriptors({ aiEnabled: false, language: "en" });

  assert.ok(descriptors.length > 0);

  const commands = descriptors.map((item) => item.command);
  assert.equal(new Set(commands).size, commands.length);
  assert.equal(descriptors[0]?.group, "Daily");
  assert.equal(descriptors.at(-1)?.command, "memobox.openSettings");

  for (const descriptor of descriptors) {
    assert.notEqual(descriptor.label.trim(), "");
    assert.notEqual(descriptor.detail.trim(), "");
    assert.notEqual(descriptor.icon.trim(), "");
  }
});

test("command launcher descriptors include AI items only when enabled", () => {
  const hiddenAiDescriptors = getMemoCommandLauncherDescriptors({ aiEnabled: false, language: "en" });
  const visibleAiDescriptors = getMemoCommandLauncherDescriptors({ aiEnabled: true, language: "en" });

  assert.equal(hiddenAiDescriptors.some((item) => item.command === "memobox.aiGenerateTitle"), false);
  assert.equal(visibleAiDescriptors.some((item) => item.command === "memobox.aiGenerateTitle"), true);
});

test("command launcher descriptors are localized for Japanese", () => {
  const descriptors = getMemoCommandLauncherDescriptors({ aiEnabled: false, language: "ja" });

  assert.equal(descriptors[0]?.group, "日常");
  assert.equal(descriptors[0]?.label, "新規メモ");
});
