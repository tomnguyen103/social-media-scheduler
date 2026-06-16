import { decrypt } from "@/lib/crypto";

export async function publishToLinkedIn(
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  platformUserId: string
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (content.toLowerCase().includes("fail_linkedin")) {
      throw new Error("Mock LinkedIn API publish failed: User not authorized.");
    }
    return `urn:li:share:mock_li_post_id_${Math.floor(Math.random() * 10000000)}`;
  }

  try {
    const urnAuthor = platformUserId.startsWith("urn:li:")
      ? platformUserId
      : `urn:li:person:${platformUserId}`;

    const body: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
      author: urnAuthor,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    // If media is attached, in production we register the media, upload the binary,
    // and set the media reference. Here we'll implement the payload schema.
    if (mediaUrls && mediaUrls.length > 0) {
      // For this spec, we will format as IMAGE category if URLs are present.
      // (Full media register/upload requires binary upload. If not fully registered, LinkedIn API throws error.
      // We will create the structure; if a live token is used, it should be registered, otherwise we fall back to NONE
      // or try to attach it if we register it.)
      try {
        // Step 1: Register upload
        const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            registerRequest: {
              recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
              owner: urnAuthor,
              relationshipType: "OWNER",
            },
          }),
        });

        if (registerRes.ok) {
          const registerData = await registerRes.json();
          const asset = registerData.value.asset;
          const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;

          // Step 2: Upload binary
          const imageRes = await fetch(mediaUrls[0]);
          const blob = await imageRes.blob();
          
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: blob,
          });

          if (uploadRes.ok) {
            body.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE";
            body.specificContent["com.linkedin.ugc.ShareContent"].media = [
              {
                status: "READY",
                description: {
                  text: "Shared Media",
                },
                media: asset,
                title: {
                  text: "Post Image",
                },
              },
            ];
          }
        }
      } catch (mediaErr) {
        console.error("LinkedIn media attachment failed, posting text-only fallback:", mediaErr);
      }
    }

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `LinkedIn API publish failed: ${errorData.message || res.statusText}`
      );
    }

    const data = await res.json();
    return data.id; // returns UGC Post ID (e.g. urn:li:share:12345)
  } catch (error) {
    const err = error as Error;
    console.error("LinkedIn publish error:", err);
    throw new Error(err.message || "Failed to publish to LinkedIn");
  }
}

export async function refreshLinkedInToken(
  encryptedRefreshToken: string | null,
  encryptedAccessToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  if (!encryptedRefreshToken) {
    // LinkedIn tokens can last 60 days without refresh. We can fall back to existing.
    return {
      accessToken: decrypt(encryptedAccessToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // assume 30 more days
    };
  }

  const refreshToken = decrypt(encryptedRefreshToken);

  if (refreshToken.startsWith("mock_refresh_token_") || refreshToken === "mock_refresh_token") {
    return {
      accessToken: `mock_access_token_linkedin_${Date.now()}`,
      refreshToken: `mock_refresh_token_linkedin_${Date.now()}`,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    };
  }

  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      }),
    });

    if (!res.ok) {
      throw new Error(`LinkedIn token refresh response error: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token, // might rotate
      expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
    };
  } catch (error) {
    const err = error as Error;
    console.error("LinkedIn token refresh error:", err);
    throw new Error(err.message || "Failed to refresh LinkedIn token");
  }
}
