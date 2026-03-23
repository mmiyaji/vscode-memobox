import test from "node:test";
import assert from "node:assert/strict";
import {
  initializeMemoBoxLogging,
  logMemoBoxAiError,
  logMemoBoxInfo,
  resetMemoBoxLoggingForTest
} from "../src/shared/logging";

test.afterEach(() => {
  resetMemoBoxLoggingForTest();
});

test("logger respects log levels and writes to the expected channels", () => {
  const generalLines: string[] = [];
  const aiLines: string[] = [];

  initializeMemoBoxLogging({
    generalChannel: {
      appendLine: (value) => {
        generalLines.push(value);
      },
      show: () => undefined
    },
    aiChannel: {
      appendLine: (value) => {
        aiLines.push(value);
      },
      show: () => undefined
    },
    getLogLevel: () => "warn"
  });

  logMemoBoxInfo("setup", "This should be filtered.");
  logMemoBoxAiError("command", "This should be recorded.", { title: "AI task" });

  assert.equal(generalLines.length, 0);
  assert.equal(aiLines.length, 1);
  assert.match(aiLines[0] ?? "", /\[ERROR\] \[command\] This should be recorded\./);
  assert.match(aiLines[0] ?? "", /title="AI task"/);
});

test("logger includes metadata for general logs", () => {
  const generalLines: string[] = [];

  initializeMemoBoxLogging({
    generalChannel: {
      appendLine: (value) => {
        generalLines.push(value);
      },
      show: () => undefined
    },
    aiChannel: {
      appendLine: () => undefined,
      show: () => undefined
    },
    getLogLevel: () => "info"
  });

  logMemoBoxInfo("index", "Index refreshed.", {
    entries: 12,
    scannedFiles: 18
  });

  assert.equal(generalLines.length, 1);
  assert.match(generalLines[0] ?? "", /\[INFO\] \[index\] Index refreshed\./);
  assert.match(generalLines[0] ?? "", /entries=12/);
  assert.match(generalLines[0] ?? "", /scannedFiles=18/);
});
