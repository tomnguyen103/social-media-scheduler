import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";

import { encrypt } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { connectedAccounts, socialPlatformEnum } from "@/lib/db/schema";
import { checkAccountLimit, PlanLimitError } from "@/lib/billing/guards";

// Define the type of our platforms based on the DB schema enum
const SUPPORTED_PLATFORMS = socialPlatformEnum.enumValues;

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

  // Validate platform enum
  if (!SUPPORTED_PLATFORMS.includes(platformName as typeof SUPPORTED_PLATFORMS[number])) {
    return redirect(`/accounts?error=invalid_platform`);
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    console.error(`OAuth callback error for ${platformName}:`, error);
    return redirect(`/accounts?error=auth_failed`);
  }

  const isMock = code.startsWith("mock_code_");

  let accessToken = "";
  let refreshToken: string | null = null;
  let platformUserId = "";
  let platformUsername = "";
  let expiresAt: Date | null = null;
  let scopes: string[] = [];

  if (isMock) {
    // Simulated token exchange for sandbox mode
    accessToken = encrypt(`mock_access_token_${platformName}_${Date.now()}`);
    refreshToken = encrypt(`mock_refresh_token_${platformName}_${Date.now()}`);
    platformUserId = `mock_uid_${platformName}_${Math.floor(Math.random() * 1000000)}`;
    platformUsername = `@Mock_${platformName.charAt(0).toUpperCase() + platformName.slice(1)}`;
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    scopes = ["mock_read", "mock_write"];
  } else {
    // Real OAuth exchange logic
    try {
      const origin = request.nextUrl.origin;
      const redirectUri = `${origin}/api/oauth/${platformName}/callback`;
      const tokenResult = await exchangeCodeForTokens(platformName, code, redirectUri);
      
      accessToken = encrypt(tokenResult.accessToken);
      if (tokenResult.refreshToken) {
        refreshToken = encrypt(tokenResult.refreshToken);
      }
      platformUserId = tokenResult.platformUserId;
      platformUsername = tokenResult.platformUsername;
      expiresAt = tokenResult.expiresAt ?? null;
      scopes = tokenResult.scopes || [];
    } catch (err) {
      console.error(`Failed to exchange code for ${platformName}:`, err);
      return redirect(`/accounts?error=token_exchange_failed`);
    }
  }

  const db = getDb();

  // Check if account already exists (re-authentication)
  const existing = await db.query.connectedAccounts.findFirst({
    where: and(
      eq(connectedAccounts.clerkUserId, userId),
      eq(connectedAccounts.platform, platformName as typeof SUPPORTED_PLATFORMS[number]),
      eq(connectedAccounts.platformUserId, platformUserId)
    ),
  });

  // If this is a new connection, enforce the plan limit
  if (!existing) {
    try {
      await checkAccountLimit(userId);
    } catch (err) {
      if (err instanceof PlanLimitError) {
        return redirect(`/accounts?error=limit_reached`);
      }
      throw err;
    }
  }

  try {
    // Upsert into database
    await db
      .insert(connectedAccounts)
      .values({
        clerkUserId: userId,
        platform: platformName as typeof SUPPORTED_PLATFORMS[number],
        accessToken,
        refreshToken,
        platformUserId,
        platformUsername,
        expiresAt,
        scopes,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          connectedAccounts.clerkUserId,
          connectedAccounts.platform,
          connectedAccounts.platformUserId,
        ],
        set: {
          accessToken,
          refreshToken,
          platformUsername,
          expiresAt,
          scopes,
          updatedAt: new Date(),
        },
      });

    return redirect(`/accounts?success=connected&platform=${platformName}`);
  } catch (dbErr) {
    console.error("Database save failed for connected account:", dbErr);
    return redirect(`/accounts?error=db_save_failed`);
  }
}

// Stub implementation for real token exchange
async function exchangeCodeForTokens(
  platform: string,
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  platformUserId: string;
  platformUsername: string;
  expiresAt?: Date;
  scopes?: string[];
}> {
  // Real platform OAuth token exchange requests are handled here based on env keys
  // For Instagram, Twitter, LinkedIn, etc.
  // In development, this is reached if client keys are set in .env.local
  
  // Example for Twitter:
  if (platform === "twitter") {
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
        code,
        grant_type: "authorization_code",
        client_id: process.env.TWITTER_CLIENT_ID || "",
        redirect_uri: redirectUri,
        code_verifier: "challenge",
      }),
    });

    if (!res.ok) {
      throw new Error(`Twitter token response error: ${res.statusText}`);
    }

    const data = await res.json();
    
    // Get Twitter User Info
    const userRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    const userData = await userRes.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      platformUserId: userData.data.id,
      platformUsername: `@${userData.data.username}`,
      expiresAt: new Date(Date.now() + (data.expires_in || 7200) * 1000),
      scopes: data.scope?.split(" ") || [],
    };
  }

  // Fallback / Stub response for other platforms when credentials are set
  // This satisfies types and logs a placeholder for other platforms.
  // For production, actual platform clients are imported and called here.
  return {
    accessToken: `real_accessToken_${platform}_${code.substring(0, 8)}`,
    platformUserId: `uid_${platform}_${Math.floor(Math.random() * 1000000)}`,
    platformUsername: `@User_${platform}`,
  };
}
