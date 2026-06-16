import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getPostPublisherQueue, getTokenRefreshQueue } from "@/lib/bullmq/queues";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";

// Import workers to activate them in the test process
import { publisherWorker } from "./publisher";
import { tokenRefreshWorker } from "./token-refresh";

async function runTests() {
  console.log("=== STARTING WORKERS INTEGRATION TESTS ===");
  const db = getDb();
  
  const testUserId = "user_test_worker";
  const mockTwitterAccountId = "00000000-0000-0000-0000-000000000001";
  const mockInstagramAccountId = "00000000-0000-0000-0000-000000000002";

  try {
    // 1. Prepare User and Accounts
    console.log("1. Upserting test user...");
    await db
      .insert(schema.users)
      .values({
        clerkUserId: testUserId,
        email: "test-worker@socialcopilot.com",
        plan: "pro", // Pro plan has access to AI and multiple accounts
      })
      .onConflictDoUpdate({
        target: schema.users.clerkUserId,
        set: { updatedAt: new Date() },
      });

    console.log("2. Upserting mock connected accounts...");
    // Twitter account
    await db
      .insert(schema.connectedAccounts)
      .values({
        id: mockTwitterAccountId,
        clerkUserId: testUserId,
        platform: "twitter",
        accessToken: encrypt("mock_access_token_twitter"),
        refreshToken: encrypt("mock_refresh_token_twitter"),
        platformUserId: "tw_user_123",
        platformUsername: "@Mock_Twitter",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // expires in 30 mins (trigger refresh)
        scopes: ["mock_read", "mock_write"],
      })
      .onConflictDoUpdate({
        target: [
          schema.connectedAccounts.clerkUserId,
          schema.connectedAccounts.platform,
          schema.connectedAccounts.platformUserId,
        ],
        set: {
          accessToken: encrypt("mock_access_token_twitter"),
          refreshToken: encrypt("mock_refresh_token_twitter"),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          updatedAt: new Date(),
        },
      });

    // Instagram account
    await db
      .insert(schema.connectedAccounts)
      .values({
        id: mockInstagramAccountId,
        clerkUserId: testUserId,
        platform: "instagram",
        accessToken: encrypt("mock_access_token_instagram"),
        refreshToken: encrypt("mock_refresh_token_instagram"),
        platformUserId: "ig_user_123",
        platformUsername: "@Mock_Instagram",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // expires in 48 hours (won't trigger refresh)
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
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });

    // 3. Test Token Refresh Worker
    console.log("3. Testing token refresh worker...");
    const refreshQueue = getTokenRefreshQueue();
    await refreshQueue.add("refreshTokenJob", {});
    console.log("Added refresh job to queue, waiting 3s for token-refresh worker to process...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Verify Twitter token was refreshed (expiration extended) and Instagram was NOT
    const twAccount = await db.query.connectedAccounts.findFirst({
      where: eq(schema.connectedAccounts.id, mockTwitterAccountId),
    });
    const igAccount = await db.query.connectedAccounts.findFirst({
      where: eq(schema.connectedAccounts.id, mockInstagramAccountId),
    });

    const thirtyMinsFromNow = Date.now() + 31 * 60 * 1000;
    if (twAccount && twAccount.expiresAt && twAccount.expiresAt.getTime() > thirtyMinsFromNow) {
      console.log("✓ Success: Twitter token was successfully refreshed and extended.");
    } else {
      console.error("✗ Failure: Twitter token was not refreshed/extended.", twAccount?.expiresAt);
    }

    if (igAccount && igAccount.expiresAt && igAccount.expiresAt.getTime() < Date.now() + 49 * 60 * 60 * 1000) {
      console.log("✓ Success: Instagram token was skipped (already valid > 24 hours).");
    } else {
      console.error("✗ Failure: Instagram token expiration was modified unexpectedly.");
    }

    // 4. Test Post Publisher Worker (Successful Publish)
    console.log("4. Testing successful post publishing...");
    const [successPost] = await db
      .insert(schema.posts)
      .values({
        clerkUserId: testUserId,
        content: "Testing Social Copilot publishing! #test",
        mediaUrls: ["https://ik.imagekit.io/test_image.jpg"],
        status: "scheduled",
        scheduledAt: new Date(),
      })
      .returning();

    await db.insert(schema.postTargets).values([
      {
        postId: successPost.id,
        connectedAccountId: mockTwitterAccountId,
        status: "pending",
      },
      {
        postId: successPost.id,
        connectedAccountId: mockInstagramAccountId,
        status: "pending",
      },
    ]);

    const publisherQueue = getPostPublisherQueue();
    const successJob = await publisherQueue.add(
      "publishPost",
      { postId: successPost.id },
      {
        attempts: 3,
        backoff: { type: "fixed", delay: 100 },
      }
    );

    // Create scheduled job record
    await db.insert(schema.scheduledJobs).values({
      postId: successPost.id,
      bullmqJobId: successJob.id!,
      scheduledAt: new Date(),
      status: "waiting",
    });

    console.log(`Added success job ${successJob.id} to queue, waiting 4s for processing...`);
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Verify post status and target statuses
    const updatedPost = await db.query.posts.findFirst({
      where: eq(schema.posts.id, successPost.id),
      with: {
        targets: true,
        scheduledJob: true,
      },
    });

    if (updatedPost && updatedPost.status === "published") {
      console.log("✓ Success: Post status updated to 'published'.");
    } else {
      console.error("✗ Failure: Post status is not 'published':", updatedPost?.status);
    }

    const allTargetsPublished = updatedPost?.targets.every((t) => t.status === "published" && t.platformPostId);
    if (allTargetsPublished) {
      console.log("✓ Success: All target platforms marked as 'published' with platform post IDs.");
    } else {
      console.error("✗ Failure: Some target platforms failed or missing IDs:", updatedPost?.targets);
    }

    if (updatedPost?.scheduledJob?.status === "completed") {
      console.log("✓ Success: Scheduled job record marked as 'completed'.");
    } else {
      console.error("✗ Failure: Scheduled job status not updated:", updatedPost?.scheduledJob?.status);
    }

    // 5. Test Partial Failure and Retry/DLQ logic
    console.log("5. Testing retry and dead letter queue (DLQ) functionality...");
    // Let's create a post text with 'fail_instagram' to trigger failure on Instagram target only
    const [failPost] = await db
      .insert(schema.posts)
      .values({
        clerkUserId: testUserId,
        content: "Testing publisher fail_instagram retry flow!",
        mediaUrls: ["https://ik.imagekit.io/test_image.jpg"],
        status: "scheduled",
        scheduledAt: new Date(),
      })
      .returning();

    await db.insert(schema.postTargets).values([
      {
        postId: failPost.id,
        connectedAccountId: mockTwitterAccountId, // should succeed
        status: "pending",
      },
      {
        postId: failPost.id,
        connectedAccountId: mockInstagramAccountId, // will fail because content contains 'fail_instagram'
        status: "pending",
      },
    ]);

    // Add with 3 attempts and very fast delay so it runs retries quickly
    const failJob = await publisherQueue.add(
      "publishPost",
      { postId: failPost.id },
      {
        attempts: 3,
        backoff: { type: "fixed", delay: 200 },
      }
    );

    await db.insert(schema.scheduledJobs).values({
      postId: failPost.id,
      bullmqJobId: failJob.id!,
      scheduledAt: new Date(),
      status: "waiting",
    });

    console.log(`Added failing job ${failJob.id} to queue, waiting 5s for retries to exhaust...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify post status and target statuses
    const updatedFailPost = await db.query.posts.findFirst({
      where: eq(schema.posts.id, failPost.id),
      with: {
        targets: true,
        scheduledJob: true,
      },
    });

    if (updatedFailPost && updatedFailPost.status === "partial_failure") {
      console.log("✓ Success: Post status updated to 'partial_failure'.");
    } else {
      console.error("✗ Failure: Post status is not 'partial_failure':", updatedFailPost?.status);
    }

    const twTarget = updatedFailPost?.targets.find((t) => t.connectedAccountId === mockTwitterAccountId);
    const igTarget = updatedFailPost?.targets.find((t) => t.connectedAccountId === mockInstagramAccountId);

    if (twTarget?.status === "published") {
      console.log("✓ Success: Twitter target successfully published and not re-published on retry.");
    } else {
      console.error("✗ Failure: Twitter target is not 'published':", twTarget?.status);
    }

    if (igTarget?.status === "failed" && igTarget.errorMessage) {
      console.log("✓ Success: Instagram target marked as 'failed' with error: " + igTarget.errorMessage);
    } else {
      console.error("✗ Failure: Instagram target is not 'failed' or missing message:", igTarget);
    }

    if (updatedFailPost?.scheduledJob?.status === "failed") {
      console.log("✓ Success: Scheduled job record marked as 'failed'.");
    } else {
      console.error("✗ Failure: Scheduled job status not updated:", updatedFailPost?.scheduledJob?.status);
    }

    // 6. Clean up test database records
    console.log("6. Cleaning up database test records...");
    await db.delete(schema.scheduledJobs).where(eq(schema.scheduledJobs.postId, successPost.id));
    await db.delete(schema.scheduledJobs).where(eq(schema.scheduledJobs.postId, failPost.id));
    await db.delete(schema.postTargets).where(eq(schema.postTargets.postId, successPost.id));
    await db.delete(schema.postTargets).where(eq(schema.postTargets.postId, failPost.id));
    await db.delete(schema.posts).where(eq(schema.posts.id, successPost.id));
    await db.delete(schema.posts).where(eq(schema.posts.id, failPost.id));
    await db.delete(schema.connectedAccounts).where(eq(schema.connectedAccounts.clerkUserId, testUserId));
    await db.delete(schema.users).where(eq(schema.users.clerkUserId, testUserId));
    
    console.log("✓ Cleaned up test database records successfully.");

  } catch (err) {
    console.error("INTEGRATION TESTS CRASHED:", err);
  } finally {
    console.log("Closing workers and queue connections...");
    await publisherWorker.close();
    await tokenRefreshWorker.close();
    console.log("=== INTEGRATION TESTS COMPLETED ===");
    process.exit(0);
  }
}

runTests();
