import { decrypt } from "@/lib/crypto";

export async function publishToPinterest(
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  platformUserId: string
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (content.toLowerCase().includes("fail_pinterest")) {
      throw new Error("Mock Pinterest API publish failed: Board not found.");
    }
    return `mock_pin_id_${Math.floor(Math.random() * 10000000)}`;
  }

  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error("Pinterest requires an image file. Text-only posts are not supported.");
  }

  try {
    let boardId = platformUserId;

    // In Pinterest, Pins must belong to a Board. If the connection profile did not supply a board ID,
    // we can attempt to fetch the user's boards and pick the first one.
    if (!boardId || boardId.startsWith("uid_") || boardId.startsWith("mock_")) {
      const boardsRes = await fetch("https://api.pinterest.com/v5/boards", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        if (boardsData.items && boardsData.items.length > 0) {
          boardId = boardsData.items[0].id;
        }
      }
    }

    if (!boardId) {
      throw new Error("Pinterest publish failed: No board ID found to attach Pin.");
    }

    const payload = {
      title: content.substring(0, 100),
      description: content,
      board_id: boardId,
      media_source: {
        source_type: "image_url",
        url: mediaUrls[0],
      },
    };

    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Pinterest API publish failed: ${errorData.message || res.statusText}`
      );
    }

    const data = await res.json();
    return data.id; // Pin ID
  } catch (error) {
    const err = error as Error;
    console.error("Pinterest publish error:", err);
    throw new Error(err.message || "Failed to publish to Pinterest");
  }
}

export async function refreshPinterestToken(
  encryptedRefreshToken: string | null,
  _encryptedAccessToken: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  if (!encryptedRefreshToken) {
    throw new Error("Refresh token is required to refresh Pinterest credentials");
  }

  const refreshToken = decrypt(encryptedRefreshToken);

  if (refreshToken.startsWith("mock_refresh_token_") || refreshToken === "mock_refresh_token") {
    return {
      accessToken: `mock_access_token_pinterest_${Date.now()}`,
      refreshToken: `mock_refresh_token_pinterest_${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Pinterest tokens last 30 days
    };
  }

  try {
    const authHeader = Buffer.from(
      `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
    ).toString("base64");

    const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      throw new Error(`Pinterest token refresh response error: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 2592000) * 1000),
    };
  } catch (error) {
    const err = error as Error;
    console.error("Pinterest token refresh error:", err);
    throw new Error(err.message || "Failed to refresh Pinterest token");
  }
}
