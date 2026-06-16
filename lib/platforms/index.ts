import { publishToInstagram, refreshInstagramToken } from "./instagram";
import { publishToTwitter, refreshTwitterToken } from "./twitter";
import { publishToLinkedIn, refreshLinkedInToken } from "./linkedin";
import { publishToFacebook, refreshFacebookToken } from "./facebook";
import { publishToYouTube, refreshYouTubeToken } from "./youtube";
import { publishToTikTok, refreshTikTokToken } from "./tiktok";
import { publishToDiscord, refreshDiscordToken } from "./discord";
import { publishToSlack, refreshSlackToken } from "./slack";
import { publishToPinterest, refreshPinterestToken } from "./pinterest";

export type SupportedPlatform =
  | "instagram"
  | "twitter"
  | "linkedin"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "discord"
  | "slack"
  | "pinterest";

export async function publishToPlatform(
  platform: SupportedPlatform,
  encryptedAccessToken: string,
  content: string,
  mediaUrls: string[],
  platformUserId: string
): Promise<string> {
  const p = platform.toLowerCase() as SupportedPlatform;
  
  switch (p) {
    case "instagram":
      return publishToInstagram(encryptedAccessToken, content, mediaUrls, platformUserId);
    case "twitter":
      return publishToTwitter(encryptedAccessToken, content, mediaUrls, platformUserId);
    case "linkedin":
      return publishToLinkedIn(encryptedAccessToken, content, mediaUrls, platformUserId);
    case "facebook":
      return publishToFacebook(encryptedAccessToken, content, mediaUrls, platformUserId);
    case "youtube":
      return publishToYouTube(encryptedAccessToken, content, mediaUrls, platformUserId);
    case "tiktok":
      return publishToTikTok(encryptedAccessToken, content, mediaUrls, platformUserId);
    case "discord":
      return publishToDiscord(encryptedAccessToken, content, mediaUrls, platformUserId);
    case "slack":
      return publishToSlack(encryptedAccessToken, content, mediaUrls, platformUserId);
    case "pinterest":
      return publishToPinterest(encryptedAccessToken, content, mediaUrls, platformUserId);
    default:
      throw new Error(`Unsupported platform for publishing: ${platform}`);
  }
}

export async function refreshPlatformToken(
  platform: SupportedPlatform,
  encryptedRefreshToken: string | null,
  encryptedAccessToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  const p = platform.toLowerCase() as SupportedPlatform;

  switch (p) {
    case "instagram":
      return refreshInstagramToken(encryptedRefreshToken, encryptedAccessToken);
    case "twitter":
      return refreshTwitterToken(encryptedRefreshToken, encryptedAccessToken);
    case "linkedin":
      return refreshLinkedInToken(encryptedRefreshToken, encryptedAccessToken);
    case "facebook":
      return refreshFacebookToken(encryptedRefreshToken, encryptedAccessToken);
    case "youtube":
      return refreshYouTubeToken(encryptedRefreshToken, encryptedAccessToken);
    case "tiktok":
      return refreshTikTokToken(encryptedRefreshToken, encryptedAccessToken);
    case "discord":
      return refreshDiscordToken(encryptedRefreshToken, encryptedAccessToken);
    case "slack":
      return refreshSlackToken(encryptedRefreshToken, encryptedAccessToken);
    case "pinterest":
      return refreshPinterestToken(encryptedRefreshToken, encryptedAccessToken);
    default:
      throw new Error(`Unsupported platform for token refresh: ${platform}`);
  }
}

export * from "./comments";
export * from "./analytics";

