import { decrypt } from "@/lib/crypto";

export async function publishToTikTok(
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  _platformUserId: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (content.toLowerCase().includes("fail_tiktok")) {
      throw new Error("Mock TikTok API publish failed: Video file size too large.");
    }
    return `mock_tt_post_id_${Math.floor(Math.random() * 10000000)}`;
  }

  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error("TikTok requires a video file. Text-only posts are not supported.");
  }

  const videoUrl = mediaUrls[0];
  const isVideo = videoUrl.match(/\.(mp4|mov|avi|mkv|webm)/i);
  if (!isVideo) {
    throw new Error("TikTok requires a video file format (e.g. mp4, mov).");
  }

  try {
    // TikTok Content Posting API (Direct Publish using PULL_FROM_URL)
    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: content.substring(0, 150), // TikTok title limit
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: videoUrl,
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `TikTok API publish failed: ${
          errorData.error?.message || errorData.message || res.statusText
        }`
      );
    }

    const data = await res.json();
    // TikTok returns publish_id which can be used to poll the publish status
    return data.data.publish_id;
  } catch (error) {
    const err = error as Error;
    console.error("TikTok publish error:", err);
    throw new Error(err.message || "Failed to publish to TikTok");
  }
}

export async function refreshTikTokToken(
  encryptedRefreshToken: string | null,
  _encryptedAccessToken: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  if (!encryptedRefreshToken) {
    throw new Error("Refresh token is required to refresh TikTok credentials");
  }

  const refreshToken = decrypt(encryptedRefreshToken);

  if (refreshToken.startsWith("mock_refresh_token_") || refreshToken === "mock_refresh_token") {
    return {
      accessToken: `mock_access_token_tiktok_${Date.now()}`,
      refreshToken: `mock_refresh_token_tiktok_${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours typical for TikTok
    };
  }

  try {
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || "",
        client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`TikTok token refresh response error: ${res.statusText} - ${errText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 86400) * 1000),
    };
  } catch (error) {
    const err = error as Error;
    console.error("TikTok token refresh error:", err);
    throw new Error(err.message || "Failed to refresh TikTok token");
  }
}
