import { decrypt } from "@/lib/crypto";

export async function publishToInstagram(
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  platformUserId: string
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API latency
    if (content.toLowerCase().includes("fail_instagram")) {
      throw new Error("Mock Instagram API publish failed: Rate limit exceeded.");
    }
    return `mock_ig_post_id_${Math.floor(Math.random() * 10000000)}`;
  }

  // Instagram Graph API implementation
  // Instagram requires at least one image or video.
  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error("Instagram requires at least one image or video. Text-only posts are not supported.");
  }

  const mediaUrl = mediaUrls[0];
  const isVideo = mediaUrl.match(/\.(mp4|mov|avi|mkv|webm)/i);

  try {
    // Step 1: Create media container
    // We target the Instagram Business Account ID (platformUserId)
    const containerUrl = `https://graph.facebook.com/v18.0/${platformUserId}/media`;
    const containerParams = new URLSearchParams({
      access_token: accessToken,
      caption: content,
    });

    if (isVideo) {
      containerParams.set("media_type", "REELS");
      containerParams.set("video_url", mediaUrl);
    } else {
      containerParams.set("image_url", mediaUrl);
    }

    const containerRes = await fetch(`${containerUrl}?${containerParams.toString()}`, {
      method: "POST",
    });

    if (!containerRes.ok) {
      const errorData = await containerRes.json().catch(() => ({}));
      throw new Error(
        `Instagram media container creation failed: ${
          errorData.error?.message || containerRes.statusText
        }`
      );
    }

    const containerData = await containerRes.json();
    const creationId = containerData.id;

    // For video/reels, Facebook/Instagram needs time to process the video.
    // We'll perform a quick status check loop or short wait.
    if (isVideo) {
      let ready = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!ready && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;

        const statusRes = await fetch(
          `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${accessToken}`
        );

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status_code === "FINISHED") {
            ready = true;
          } else if (statusData.status_code === "ERROR") {
            throw new Error("Instagram media processing failed.");
          }
        }
      }

      if (!ready) {
        throw new Error("Instagram media processing timed out.");
      }
    } else {
      // Small buffer delay for images
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Step 2: Publish the media container
    const publishUrl = `https://graph.facebook.com/v18.0/${platformUserId}/media_publish`;
    const publishRes = await fetch(
      `${publishUrl}?creation_id=${creationId}&access_token=${accessToken}`,
      { method: "POST" }
    );

    if (!publishRes.ok) {
      const errorData = await publishRes.json().catch(() => ({}));
      throw new Error(
        `Instagram media publish failed: ${errorData.error?.message || publishRes.statusText}`
      );
    }

    const publishData = await publishRes.json();
    return publishData.id;
  } catch (error) {
    const err = error as Error;
    console.error("Instagram publish error:", err);
    throw new Error(err.message || "Failed to publish to Instagram");
  }
}

export async function refreshInstagramToken(
  encryptedRefreshToken: string | null,
  encryptedAccessToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const accessToken = decrypt(encryptedAccessToken);

  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    return {
      accessToken: `mock_access_token_instagram_${Date.now()}`,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    };
  }

  // Refresh Instagram long-lived access token
  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    );

    if (!res.ok) {
      throw new Error(`Instagram token refresh failed: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000), // Default 60 days
    };
  } catch (error) {
    const err = error as Error;
    console.error("Instagram token refresh error:", err);
    throw new Error(err.message || "Failed to refresh Instagram token");
  }
}
