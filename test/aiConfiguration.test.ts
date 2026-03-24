import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLegacyMemoBoxAiSettings,
  normalizeMemoBoxAiSettings,
  resolveMemoBoxAiConfiguration,
  resolveMemoBoxAiConfigurationWithSecrets
} from "../src/infra/ai/configuration";
import { initializeMemoBoxAiSecrets, resetMemoBoxAiSecretsForTest } from "../src/infra/ai/secrets";

test("normalizeMemoBoxAiSettings keeps valid profiles and falls back missing defaults", () => {
  const settings = normalizeMemoBoxAiSettings({
    defaultProfile: "cloud",
    profiles: {
      cloud: {
        provider: "openai",
        endpoint: "https://api.openai.com/v1",
        model: "gpt-5-mini",
        apiKeyEnv: "OPENAI_API_KEY",
        timeoutMs: 120000
      }
    }
  });

  assert.equal(settings.defaultProfile, "cloud");
  assert.equal(settings.profiles.cloud?.provider, "openai");
  assert.equal(settings.profiles.cloud?.apiKeyEnv, "OPENAI_API_KEY");
  assert.equal(settings.profiles.cloud?.timeoutMs, 120000);
});

test("buildLegacyMemoBoxAiSettings maps flat settings into the local profile", () => {
  const settings = buildLegacyMemoBoxAiSettings({
    provider: "openai",
    endpoint: "https://api.openai.com/v1",
    model: "gpt-5-mini",
    apiKey: "secret"
  });

  assert.equal(settings.defaultProfile, "local");
  assert.ok(settings.profiles.local);
  assert.equal(settings.profiles.local.provider, "openai");
  assert.equal(settings.profiles.local.apiKey, "secret");
});

test("resolveMemoBoxAiConfiguration reports disabled and misconfigured states", () => {
  const disabled = resolveMemoBoxAiConfiguration({
    aiEnabled: false,
    ai: buildLegacyMemoBoxAiSettings({})
  });
  assert.equal(disabled.enabled, false);

  const broken = resolveMemoBoxAiConfiguration({
    aiEnabled: true,
    ai: normalizeMemoBoxAiSettings({
      defaultProfile: "broken",
      profiles: {
        broken: {
          provider: "openai",
          endpoint: "",
          model: ""
        }
      }
    })
  });

  assert.equal(broken.configured, false);
  assert.match(broken.issues[0] ?? "", /profile "broken"/);
});

test("resolveMemoBoxAiConfiguration reports missing API keys for openai profiles", () => {
  const resolved = resolveMemoBoxAiConfiguration({
    aiEnabled: true,
    ai: normalizeMemoBoxAiSettings({
      defaultProfile: "cloud",
      profiles: {
        cloud: {
          provider: "openai",
          endpoint: "https://api.openai.com/v1",
          model: "gpt-5-mini",
          apiKey: "",
          apiKeyEnv: ""
        }
      }
    })
  });

  assert.equal(resolved.configured, false);
  assert.match(resolved.issues.join(" "), /API key is empty/);
  assert.match(resolved.issues.join(" "), /profile "cloud"/);
});

test.afterEach(() => {
  resetMemoBoxAiSecretsForTest();
});

test("resolveMemoBoxAiConfigurationWithSecrets uses SecretStorage for openai profiles", async () => {
  initializeMemoBoxAiSecrets({
    get: async (key) => key === "memobox.ai.profiles.cloud.apiKey" ? "secret-from-store" : undefined,
    store: async () => undefined,
    delete: async () => undefined
  });

  const resolved = await resolveMemoBoxAiConfigurationWithSecrets({
    aiEnabled: true,
    ai: normalizeMemoBoxAiSettings({
      defaultProfile: "cloud",
      profiles: {
        cloud: {
          provider: "openai",
          endpoint: "https://api.openai.com/v1",
          model: "gpt-5-mini",
          apiKey: "",
          apiKeyEnv: ""
        }
      }
    })
  });

  assert.equal(resolved.configured, true);
  assert.equal(resolved.profile?.apiKeyValue, "secret-from-store");
  assert.equal(resolved.profile?.apiKeySource, "secretStorage");
});

test("resolveMemoBoxAiConfiguration prefers SecretStorage over settings apiKey", async () => {
  initializeMemoBoxAiSecrets({
    get: async () => "secret-from-store",
    store: async () => undefined,
    delete: async () => undefined
  });

  const resolved = await resolveMemoBoxAiConfigurationWithSecrets({
    aiEnabled: true,
    ai: normalizeMemoBoxAiSettings({
      defaultProfile: "cloud",
      profiles: {
        cloud: {
          provider: "openai",
          endpoint: "https://api.openai.com/v1",
          model: "gpt-5-mini",
          apiKey: "secret-from-settings",
          apiKeyEnv: ""
        }
      }
    })
  });

  assert.equal(resolved.profile?.apiKeyValue, "secret-from-store");
  assert.equal(resolved.profile?.apiKeySource, "secretStorage");
});

test("resolveMemoBoxAiConfiguration prefers environment variables over settings apiKey", async () => {
  process.env.MEMOBOX_AI_TEST_KEY = "secret-from-env";

  try {
    const resolved = await resolveMemoBoxAiConfigurationWithSecrets({
      aiEnabled: true,
      ai: normalizeMemoBoxAiSettings({
        defaultProfile: "cloud",
        profiles: {
          cloud: {
            provider: "openai",
            endpoint: "https://api.openai.com/v1",
            model: "gpt-5-mini",
            apiKey: "secret-from-settings",
            apiKeyEnv: "MEMOBOX_AI_TEST_KEY"
          }
        }
      })
    });

    assert.equal(resolved.profile?.apiKeyValue, "secret-from-env");
    assert.equal(resolved.profile?.apiKeySource, "environment");
  } finally {
    delete process.env.MEMOBOX_AI_TEST_KEY;
  }
});
