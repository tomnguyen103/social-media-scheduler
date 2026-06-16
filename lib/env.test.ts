import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { requireEnv } from "./env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

test("requireEnv returns a configured environment value", () => {
  process.env.SOCIAL_COPILOT_TEST_VALUE = "configured";

  assert.equal(requireEnv("SOCIAL_COPILOT_TEST_VALUE"), "configured");
});

test("requireEnv throws when an environment value is missing", () => {
  delete process.env.SOCIAL_COPILOT_TEST_VALUE;

  assert.throws(
    () => requireEnv("SOCIAL_COPILOT_TEST_VALUE"),
    /Missing required environment variable: SOCIAL_COPILOT_TEST_VALUE/,
  );
});
