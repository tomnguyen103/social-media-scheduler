import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";

function getPlatformEnv(platform: string) {
  const p = platform.toLowerCase();
  switch (p) {
    case "instagram":
      return process.env.INSTAGRAM_CLIENT_ID;
    case "youtube":
      return process.env.YOUTUBE_CLIENT_ID;
    case "tiktok":
      return process.env.TIKTOK_CLIENT_KEY;
    case "facebook":
      return process.env.FACEBOOK_APP_ID;
    case "linkedin":
      return process.env.LINKEDIN_CLIENT_ID;
    case "pinterest":
      return process.env.PINTEREST_APP_ID;
    case "discord":
      return process.env.DISCORD_CLIENT_ID;
    case "twitter":
      return process.env.TWITTER_CLIENT_ID;
    case "slack":
      return process.env.SLACK_CLIENT_ID;
    default:
      return undefined;
  }
}

function getRealOAuthUrl(platform: string, redirectUri: string): string {
  const p = platform.toLowerCase();
  const state = `state_${p}_${Date.now()}`;

  switch (p) {
    case "instagram":
      return `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code&state=${state}`;

    case "youtube":
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload+https://www.googleapis.com/auth/youtube.readonly+openid+profile&access_type=offline&prompt=consent&state=${state}`;

    case "tiktok":
      return `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${redirectUri}&scope=user.info.basic,video.publish,video.upload&response_type=code&state=${state}`;

    case "facebook":
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&scope=pages_show_list,pages_manage_posts,pages_read_engagement,public_profile&response_type=code&state=${state}`;

    case "linkedin":
      return `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20w_member_social&state=${state}`;

    case "pinterest":
      return `https://www.pinterest.com/oauth/?client_id=${process.env.PINTEREST_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=boards:read,boards:write,pins:read,pins:write&state=${state}`;

    case "discord":
      return `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds%20connections&state=${state}`;

    case "twitter":
      // Twitter OAuth 2.0 requires code_challenge. For simple redirect, we use PKCE parameters or basic state
      return `https://twitter.com/i/oauth2/authorize?client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=challenge&code_challenge_method=plain`;

    case "slack":
      return `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&user_scope=channels:read,chat:write&redirect_uri=${redirectUri}&state=${state}`;

    default:
      return "";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await params;
  const platformName = platform.toLowerCase();

  const clientId = getPlatformEnv(platformName);
  const isMock = !clientId || clientId === "replace_me";

  if (isMock) {
    return redirect(`/oauth/mock?platform=${platformName}`);
  }

  const origin = new URL(request.url).origin;
  const redirectUri = encodeURIComponent(`${origin}/api/oauth/${platformName}/callback`);

  const oauthUrl = getRealOAuthUrl(platformName, redirectUri);
  if (!oauthUrl) {
    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  }

  return redirect(oauthUrl);
}
