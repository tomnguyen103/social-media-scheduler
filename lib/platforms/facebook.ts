import { decrypt } from "@/lib/crypto";

export async function publishToFacebook(
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  platformUserId: string
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (content.toLowerCase().includes("fail_facebook")) {
      throw new Error("Mock Facebook API publish failed: Permission error.");
    }
    return `mock_fb_post_id_${Math.floor(Math.random() * 10000000)}`;
  }

  try {
    let url = "";
    const params = new URLSearchParams({
      access_token: accessToken,
    });

    if (mediaUrls && mediaUrls.length > 0) {
      // Post photo
      url = `https://graph.facebook.com/v18.0/${platformUserId}/photos`;
      params.set("url", mediaUrls[0]);
      params.set("caption", content);
    } else {
      // Post text feed
      url = `https://graph.facebook.com/v18.0/${platformUserId}/feed`;
      params.set("message", content);
    }

    const res = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Facebook API publish failed: ${errorData.error?.message || res.statusText}`
      );
    }

    const data = await res.json();
    // Facebook returns post_id or id. For photos, it returns id and post_id.
    return data.post_id || data.id;
  } catch (error) {
    const err = error as Error;
    console.error("Facebook publish error:", err);
    throw new Error(err.message || "Failed to publish to Facebook");
  }
}

export async function refreshFacebookToken(
  encryptedRefreshToken: string | null,
  encryptedAccessToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const accessToken = decrypt(encryptedAccessToken);

  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    return {
      accessToken: `mock_access_token_facebook_${Date.now()}`,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    };
  }

  // Facebook refreshes long-lived access tokens (60 days) by exchanging the existing one
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${accessToken}`
    );

    if (!res.ok) {
      throw new Error(`Facebook token exchange response error: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
    };
  } catch (error) {
    const err = error as Error;
    console.error("Facebook token refresh error:", err);
    throw new Error(err.message || "Failed to refresh Facebook token");
  }
}
