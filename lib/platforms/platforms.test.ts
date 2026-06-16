import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { encrypt } from "@/lib/crypto";
import { publishToPlatform, refreshPlatformToken, type SupportedPlatform } from "./index";

const MOCK_TOKEN = encrypt("mock_access_token");
const MOCK_REFRESH = encrypt("mock_refresh_token");

describe("Platforms Module - Mock Integration Tests", () => {
  const platforms: SupportedPlatform[] = [
    "instagram",
    "twitter",
    "linkedin",
    "facebook",
    "youtube",
    "tiktok",
    "discord",
    "slack",
    "pinterest",
  ];

  for (const platform of platforms) {
    describe(`${platform} integration`, () => {
      it("should successfully publish a mock post", async () => {
        const result = await publishToPlatform(
          platform,
          MOCK_TOKEN,
          `Testing ${platform} publication`,
          ["https://example.com/image.png"],
          "platform_user_123"
        );

        assert.ok(result);
        assert.ok(result.includes(`mock_`));
      });

      it("should throw an error on specific fail keywords", async () => {
        await assert.rejects(
          async () => {
            await publishToPlatform(
              platform,
              MOCK_TOKEN,
              `fail_${platform} post`,
              ["https://example.com/image.png"],
              "platform_user_123"
            );
          },
          (err: Error) => {
            return err.message.includes("Mock") && err.message.includes("failed");
          }
        );
      });

      it("should successfully refresh the mock token", async () => {
        const result = await refreshPlatformToken(platform, MOCK_REFRESH, MOCK_TOKEN);

        assert.ok(result.accessToken);
        assert.ok(result.accessToken.startsWith("mock_access_token_"));
        assert.ok(result.expiresAt instanceof Date);
      });
    });
  }
});
