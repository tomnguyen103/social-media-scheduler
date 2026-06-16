import { decrypt } from "@/lib/crypto";

export async function publishToYouTube(
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  _platformUserId: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (accessToken.startsWith("mock_access_token_") || accessToken === "mock_access_token") {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (content.toLowerCase().includes("fail_youtube")) {
      throw new Error("Mock YouTube API publish failed: Daily upload limit reached.");
    }
    return `mock_yt_video_id_${Math.floor(Math.random() * 10000000)}`;
  }

  // YouTube requires a video media url
  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error("YouTube requires a video file. Text-only posts are not supported.");
  }

  const videoUrl = mediaUrls[0];
  const isVideo = videoUrl.match(/\.(mp4|mov|avi|mkv|webm)/i);
  if (!isVideo) {
    throw new Error("YouTube requires a video file format (e.g. mp4, mov, avi).");
  }

  try {
    // YouTube Data API v3 Resumable Upload
    // Step 1: Initialize resumable session
    const metadata = {
      snippet: {
        title: content.substring(0, 100) || "Uploaded via Social Copilot",
        description: content,
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "public", // or unlisted/private
      },
    };

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": "", // unknown initially
          "X-Upload-Content-Type": "video/*",
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initRes.ok) {
      const errorData = await initRes.json().catch(() => ({}));
      throw new Error(
        `YouTube upload initialization failed: ${
          errorData.error?.message || initRes.statusText
        }`
      );
    }

    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) {
      throw new Error("YouTube upload failed: Missing upload Location header.");
    }

    // Step 2: Download the video and upload it to YouTube
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video from URL: ${videoUrl}`);
    }
    const videoBlob = await videoResponse.blob();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/*",
        "Content-Length": videoBlob.size.toString(),
      },
      body: videoBlob,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json().catch(() => ({}));
      throw new Error(
        `YouTube video upload failed: ${errorData.error?.message || uploadRes.statusText}`
      );
    }

    const uploadData = await uploadRes.json();
    return uploadData.id; // YouTube video ID
  } catch (error) {
    const err = error as Error;
    console.error("YouTube publish error:", err);
    throw new Error(err.message || "Failed to publish to YouTube");
  }
}

export async function refreshYouTubeToken(
  encryptedRefreshToken: string | null,
  _encryptedAccessToken: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  if (!encryptedRefreshToken) {
    throw new Error("Refresh token is required to refresh YouTube credentials");
  }

  const refreshToken = decrypt(encryptedRefreshToken);

  if (refreshToken.startsWith("mock_refresh_token_") || refreshToken === "mock_refresh_token") {
    return {
      accessToken: `mock_access_token_youtube_${Date.now()}`,
      refreshToken: `mock_refresh_token_youtube_${Date.now()}`,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // Google token is typically 1 hour
    };
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID || "",
        client_secret: process.env.YOUTUBE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`YouTube token refresh response error: ${res.statusText} - ${errText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      // Google sometimes returns a new refresh token, otherwise keep old
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  } catch (error) {
    const err = error as Error;
    console.error("YouTube token refresh error:", err);
    throw new Error(err.message || "Failed to refresh YouTube token");
  }
}
