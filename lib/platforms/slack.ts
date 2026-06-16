import { decrypt } from "@/lib/crypto";

export async function publishToSlack(
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  platformUserId: string
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (content.toLowerCase().includes("fail_slack")) {
      throw new Error("Mock Slack API publish failed: Channel archived.");
    }
    return `mock_sl_post_id_${Math.floor(Math.random() * 10000000)}`;
  }

  try {
    // Append media URLs to content if any exist
    let formattedText = content;
    if (mediaUrls && mediaUrls.length > 0) {
      formattedText += "\n" + mediaUrls.map((url) => `<${url}|Image/Video>`).join("\n");
    }

    // platformUserId is the Slack channel ID
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        channel: platformUserId,
        text: formattedText,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(`Slack API publish failed: ${data.error || res.statusText}`);
    }

    return data.ts; // returns Slack message timestamp ID
  } catch (error) {
    const err = error as Error;
    console.error("Slack publish error:", err);
    throw new Error(err.message || "Failed to publish to Slack");
  }
}

export async function refreshSlackToken(
  encryptedRefreshToken: string | null,
  encryptedAccessToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  const accessToken = decrypt(encryptedAccessToken);

  if (!encryptedRefreshToken) {
    // Slack classic tokens or tokens without rotation do not expire
    return {
      accessToken,
      expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Far future
    };
  }

  const refreshToken = decrypt(encryptedRefreshToken);

  if (refreshToken.startsWith("mock_refresh_token_") || refreshToken === "mock_refresh_token") {
    return {
      accessToken: `mock_access_token_slack_${Date.now()}`,
      refreshToken: `mock_refresh_token_slack_${Date.now()}`,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // Slack rotated tokens are 12 hours
    };
  }

  try {
    const res = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID || "",
        client_secret: process.env.SLACK_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(`Slack token refresh response error: ${data.error || res.statusText}`);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 43200) * 1000),
    };
  } catch (error) {
    const err = error as Error;
    console.error("Slack token refresh error:", err);
    throw new Error(err.message || "Failed to refresh Slack token");
  }
}
