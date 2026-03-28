import test from "node:test";
import assert from "node:assert/strict";

import { detectSlashCommandContext, getMemoSlashCommands } from "../src/core/text/slashCommands";

test("detectSlashCommandContext finds slash commands at the current position", () => {
  const context = detectSlashCommandContext("/todo");
  assert.deepEqual(context, {
    query: "todo",
    replaceStartCharacter: 0
  });
});

test("detectSlashCommandContext ignores ordinary paths", () => {
  assert.equal(detectSlashCommandContext("docs/foo/bar"), undefined);
});

test("getMemoSlashCommands includes snippet prefixes as slash commands", () => {
  const commands = getMemoSlashCommands("en", [
    {
      name: "Todo item",
      prefixes: ["todo"],
      description: "Insert todo item",
      body: "- [ ] ${1:Task}"
    }
  ]);

  const todo = commands.find((command) => command.label === "todo");
  assert.ok(todo);
  assert.equal(todo?.snippet, "- [ ] ${1:Task}");
  assert.equal(todo?.detail, "Insert todo item");
});

test("getMemoSlashCommands ignores snippet prefixes with whitespace", () => {
  const commands = getMemoSlashCommands("en", [
    {
      name: "Insert date",
      prefixes: ["insert date"],
      description: "Insert current date",
      body: "$CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE"
    }
  ]);

  assert.equal(commands.some((command) => command.label === "insert date"), false);
});
