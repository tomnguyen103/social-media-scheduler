import { decrypt } from "@/lib/crypto";

export async function publishToTwitter(
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  _platformUserId: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (content.toLowerCase().includes("fail_twitter")) {
      throw new Error("Mock Twitter API publish failed: Token has been revoked.");
    }
    return `mock_tw_post_id_${Math.floor(Math.random() * 10000000)}`;
  }

  try {
    const body = {
      text: content,
      media: undefined as { media_ids: string[] } | undefined,
    };

    // Twitter media upload is typically done using Twitter v1.1 endpoint:
    // https://upload.twitter.com/1.1/media/upload.json
    // For simplicity, if media URLs are present, we can perform standard media uploads
    // and attach them. If we need to implement media upload, we'd do a POST chunk upload.
    // For this client, we will attach media if we upload it, or proceed with text if upload fails or is skipped.
    if (mediaUrls && mediaUrls.length > 0) {
      const mediaIds: string[] = [];
      
      for (const url of mediaUrls) {
        try {
          // In a production environment, we download the media and upload it to Twitter
          const mediaResponse = await fetch(url);
          const buffer = await mediaResponse.arrayBuffer();
          
          // Form data for media upload
          const formData = new FormData();
          formData.append("media", new Blob([buffer]));

          const uploadRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.media_id_string) {
              mediaIds.push(uploadData.media_id_string);
            }
          }
        } catch (uploadErr) {
          console.error("Twitter media upload failed for URL:", url, uploadErr);
        }
      }

      if (mediaIds.length > 0) {
        body.media = { media_ids: mediaIds };
      }
    }

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Twitter API publish failed: ${errorData.detail || errorData.title || res.statusText}`
      );
    }

    const data = await res.json();
    return data.data.id;
  } catch (error) {
    const err = error as Error;
    console.error("Twitter publish error:", err);
    throw new Error(err.message || "Failed to publish to Twitter");
  }
}

export async function refreshTwitterToken(
  encryptedRefreshToken: string | null,
  _encryptedAccessToken: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  if (!encryptedRefreshToken) {
    throw new Error("Refresh token is required to refresh Twitter credentials");
  }

  const refreshToken = decrypt(encryptedRefreshToken);

  if (refreshToken.startsWith("mock_refresh_token_") || refreshToken === "mock_refresh_token") {
    return {
      accessToken: `mock_access_token_twitter_${Date.now()}`,
      refreshToken: `mock_refresh_token_twitter_${Date.now()}`,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours for Twitter OAuth 2.0
    };
  }

  try {
    const authHeader = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString("base64");

    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.TWITTER_CLIENT_ID || "",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Twitter token refresh response error: ${res.statusText} - ${errText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 7200) * 1000),
    };
  } catch (error) {
    const err = error as Error;
    console.error("Twitter token refresh error:", err);
    throw new Error(err.message || "Failed to refresh Twitter token");
  }
}
