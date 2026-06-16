import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getCommentPollerQueue } from "@/lib/bullmq/queues";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";

// Import workers to activate them in this test process
import { commentPollerWorker } from "./comment-poller";
import { autoReplyWorker } from "./auto-reply";

async function runTests() {
  console.log("=== STARTING AUTO-REPLY WORKERS INTEGRATION TESTS ===");
  const db = getDb();
  
  const testUserId = "user_test_autoreply";
  const mockAccountId = "00000000-0000-0000-0000-000000000009";
  const mockPostId = "00000000-0000-0000-0000-000000000099";

  try {
    // 1. Prepare User, Connected Account, and Post Targets
    console.log("1. Upserting test user...");
    await db
      .insert(schema.users)
      .values({
        clerkUserId: testUserId,
        email: "test-autoreply@socialcopilot.com",
        plan: "pro", // Pro plan has access to AI
      })
      .onConflictDoUpdate({
        target: schema.users.clerkUserId,
        set: { updatedAt: new Date() },
      });

    console.log("2. Upserting mock connected account...");
    await db
      .insert(schema.connectedAccounts)
      .values({
        id: mockAccountId,
        clerkUserId: testUserId,
        platform: "instagram",
        accessToken: encrypt("mock_access_token_instagram"),
        refreshToken: encrypt("mock_refresh_token_instagram"),
        platformUserId: "ig_user_autoreply_123",
        platformUsername: "@Mock_Instagram_AutoReply",
        scopes: ["mock_read", "mock_write"],
      })
      .onConflictDoUpdate({
        target: [
          schema.connectedAccounts.clerkUserId,
          schema.connectedAccounts.platform,
          schema.connectedAccounts.platformUserId,
        ],
        set: {
          accessToken: encrypt("mock_access_token_instagram"),
          refreshToken: encrypt("mock_refresh_token_instagram"),
          updatedAt: new Date(),
        },
      });

    console.log("3. Upserting test published post and post target...");
    await db
      .insert(schema.posts)
      .values({
        id: mockPostId,
        clerkUserId: testUserId,
        content: "Check out our new tool! It is state-of-the-art. #marketing",
        status: "published",
        publishedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.posts.id,
        set: { updatedAt: new Date() },
      });

    await db
      .insert(schema.postTargets)
      .values({
        postId: mockPostId,
        connectedAccountId: mockAccountId,
        status: "published",
        platformPostId: "mock_platform_post_123",
      })
      .onConflictDoUpdate({
        target: [schema.postTargets.postId, schema.postTargets.connectedAccountId],
        set: {
          status: "published",
          platformPostId: "mock_platform_post_123",
          updatedAt: new Date(),
        },
      });

    // 4. Create Auto-Reply Rules
    console.log("4. Creating test auto-reply rules...");
    const pricingRuleName = "Pricing Inquiry Rule";
    const fallbackRuleName = "General Fallback Rule";
    
    // Clean up old rules if they exist
    await db.delete(schema.autoReplyRules).where(eq(schema.autoReplyRules.clerkUserId, testUserId));

    const [pricingRule] = await db
      .insert(schema.autoReplyRules)
      .values({
        clerkUserId: testUserId,
        name: pricingRuleName,
        triggerType: "keyword_match",
        keywords: ["pricing", "cost", "how much"],
        responseTemplate: "Our pricing starts at $19/mo. Check /billing for details!",
        useAI: true, // Will call Gemini or fallback to template
        isActive: true,
        platformAccountIds: [mockAccountId],
      })
      .returning();

    const [fallbackRule] = await db
      .insert(schema.autoReplyRules)
      .values({
        clerkUserId: testUserId,
        name: fallbackRuleName,
        triggerType: "any_comment",
        keywords: [],
        responseTemplate: "Hi {username}, thanks for commenting!",
        useAI: false,
        isActive: true,
        platformAccountIds: [mockAccountId],
      })
      .returning();

    // 5. Test Comment Poller Worker
    console.log("5. Running Comment Poller job...");
    const pollerQueue = getCommentPollerQueue();
    await pollerQueue.add("commentPollerCron", { connectedAccountId: mockAccountId });

    console.log("Added poller job to queue, waiting 8 seconds for poller and auto-reply workers to execute...");
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // 6. Verify Auto-Reply Logs in Database
    console.log("6. Verifying Auto-Reply Logs in DB...");
    const logs = await db.query.autoReplyLogs.findMany({
      where: eq(schema.autoReplyLogs.postId, "mock_platform_post_123"),
      with: {
        rule: true,
      },
    });

    console.log(`Found ${logs.length} logged auto-replies.`);

    const pricingLog = logs.find((l) => l.ruleId === pricingRule.id);
    const fallbackLog = logs.find((l) => l.ruleId === fallbackRule.id);

    if (pricingLog) {
      console.log("✓ Success: Pricing rule (AI) triggered log created.");
      console.log(`  Comment matched. Reply sent: "${pricingLog.response}"`);
    } else {
      console.error("✗ Failure: Pricing rule did not trigger auto-reply.");
    }

    if (fallbackLog) {
      console.log("✓ Success: General fallback rule (template) triggered log created.");
      console.log(`  Reply sent: "${fallbackLog.response}"`);
      if (fallbackLog.response.includes("alice_mock") || fallbackLog.response.includes("spammer_mock") || fallbackLog.response.includes("first_commenter")) {
        console.log("✓ Success: Template {username} variable replacement worked.");
      } else {
        console.error("✗ Failure: Username variable replacement did not work:", fallbackLog.response);
      }
    } else {
      console.error("✗ Failure: General fallback rule did not trigger auto-reply.");
    }

    // 7. Test Duplicate Prevention
    console.log("7. Testing duplicate reply prevention...");
    const initialLogCount = logs.length;
    
    // Clear lastPolledAt to force poller to run again immediately for the free account check if needed, 
    // although our mock account isn't rate-limited yet (it was just created/cleared). Let's run poller again.
    await pollerQueue.add("commentPollerCron", { connectedAccountId: mockAccountId });
    console.log("Ran poller again, waiting 4s...");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const finalLogs = await db.query.autoReplyLogs.findMany({
      where: eq(schema.autoReplyLogs.postId, "mock_platform_post_123"),
    });

    if (finalLogs.length === initialLogCount) {
      console.log("✓ Success: Duplicate prevention worked! No duplicate replies were sent.");
    } else {
      console.error(
        `✗ Failure: Duplicate replies were created. Initial logs: ${initialLogCount}, final logs: ${finalLogs.length}`
      );
    }

    // 8. Clean up database records
    console.log("8. Cleaning up database records...");
    await db.delete(schema.autoReplyLogs).where(eq(schema.autoReplyLogs.postId, "mock_platform_post_123"));
    await db.delete(schema.autoReplyRules).where(eq(schema.autoReplyRules.clerkUserId, testUserId));
    await db.delete(schema.postTargets).where(eq(schema.postTargets.postId, mockPostId));
    await db.delete(schema.posts).where(eq(schema.posts.id, mockPostId));
    await db.delete(schema.connectedAccounts).where(eq(schema.connectedAccounts.id, mockAccountId));
    await db.delete(schema.users).where(eq(schema.users.clerkUserId, testUserId));
    console.log("✓ Database clean up complete.");

  } catch (err) {
    console.error("TESTS FAILED WITH ERROR:", err);
  } finally {
    console.log("Closing workers and queue connections...");
    await commentPollerWorker.close();
    await autoReplyWorker.close();
    console.log("=== AUTO-REPLY WORKERS INTEGRATION TESTS COMPLETED ===");
    process.exit(0);
  }
}

runTests();
