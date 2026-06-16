import { decrypt } from "@/lib/crypto";

export async function publishToDiscord(
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  platformUserId: string
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (content.toLowerCase().includes("fail_discord")) {
      throw new Error("Mock Discord API publish failed: Channel not found.");
    }
    return `mock_dc_post_id_${Math.floor(Math.random() * 10000000)}`;
  }

  try {
    const payload = {
      content: content,
      embeds: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    };

    if (mediaUrls && mediaUrls.length > 0) {
      // Add media as embeds
      payload.embeds = mediaUrls.map((url) => ({
        image: { url },
      }));
    }

    // Check if the access token is actually a Webhook URL
    if (accessToken.startsWith("https://discord.com/api/webhooks/")) {
      const res = await fetch(accessToken, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Discord webhook call failed: ${res.statusText}`);
      }

      // Webhooks might not return a message ID directly unless ?wait=true is set
      const returnUrl = new URL(accessToken);
      returnUrl.searchParams.set("wait", "true");
      
      const waitRes = await fetch(returnUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (waitRes.ok) {
        const waitData = await waitRes.json();
        return waitData.id;
      }
      
      return `discord_webhook_posted_${Date.now()}`;
    } else {
      // Standard Discord Channels API using channel_id (platformUserId) and OAuth / Bot token
      const channelId = platformUserId;
      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: accessToken.startsWith("Bot ") ? accessToken : `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: undefined })) as { message?: string };
        throw new Error(
          `Discord API channel post failed: ${errorData.message || res.statusText}`
        );
      }

      const data = await res.json() as { id: string };
      return data.id; // message ID
    }
  } catch (error) {
    const err = error as Error;
    console.error("Discord publish error:", err);
    throw new Error(err.message || "Failed to publish to Discord");
  }
}

export async function refreshDiscordToken(
  encryptedRefreshToken: string | null,
  encryptedAccessToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  const accessToken = decrypt(encryptedAccessToken);

  // If this is a Webhook, it doesn't expire
  if (accessToken.startsWith("https://discord.com/api/webhooks/")) {
    return {
      accessToken: encryptedAccessToken,
      expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // Far future
    };
  }

  if (!encryptedRefreshToken) {
    return {
      accessToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Keep for 7 days
    };
  }

  const refreshToken = decrypt(encryptedRefreshToken);

  if (refreshToken.startsWith("mock_refresh_token_") || refreshToken === "mock_refresh_token") {
    return {
      accessToken: `mock_access_token_discord_${Date.now()}`,
      refreshToken: `mock_refresh_token_discord_${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Discord tokens expire in 7 days
    };
  }

  try {
    const res = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || "",
        client_secret: process.env.DISCORD_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      throw new Error(`Discord token refresh response error: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 604800) * 1000),
    };
  } catch (error) {
    const err = error as Error;
    console.error("Discord token refresh error:", err);
    throw new Error(err.message || "Failed to refresh Discord token");
  }
}
