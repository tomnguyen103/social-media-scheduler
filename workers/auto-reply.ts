import { Worker } from "bullmq";
import { eq, and } from "drizzle-orm";

import { getRedisConnectionOptions, queueNames, type AutoReplyJobData } from "@/lib/bullmq/queues";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { publishCommentReply, type SupportedPlatform } from "@/lib/platforms";
import { getGeminiModel } from "@/lib/gemini/client";

export const autoReplyWorker = new Worker<AutoReplyJobData>(
  queueNames.autoReply,
  async (job) => {
    const { ruleId, commentId, connectedAccountId, commentText, commentUsername, platformPostId } = job.data;
    console.log(`[Auto-Reply Worker] Processing job for comment: ${commentId}, rule: ${ruleId}`);

    const db = getDb();

    // 1. Double check logs to prevent duplicate replies
    const existingLog = await db.query.autoReplyLogs.findFirst({
      where: and(
        eq(schema.autoReplyLogs.commentId, commentId),
        eq(schema.autoReplyLogs.ruleId, ruleId)
      ),
    });

    if (existingLog) {
      console.warn(`[Auto-Reply Worker] Duplicate prevention: Reply already logged for comment ${commentId}`);
      return;
    }

    // 2. Fetch Rule and Connected Account
    const rule = await db.query.autoReplyRules.findFirst({
      where: eq(schema.autoReplyRules.id, ruleId),
    });

    if (!rule || !rule.isActive) {
      console.warn(`[Auto-Reply Worker] Rule ${ruleId} not found or inactive. Skipping.`);
      return;
    }

    const account = await db.query.connectedAccounts.findFirst({
      where: eq(schema.connectedAccounts.id, connectedAccountId),
    });

    if (!account) {
      console.warn(`[Auto-Reply Worker] Account ${connectedAccountId} not found. Skipping.`);
      return;
    }

    // 3. Generate response text
    let replyText = "";

    if (rule.useAI) {
      console.log("[Auto-Reply Worker] Generating response using Gemini AI...");
      
      // Fetch original post content for context if we can find it
      let postContent = "";
      if (platformPostId) {
        const target = await db.query.postTargets.findFirst({
          where: and(
            eq(schema.postTargets.connectedAccountId, connectedAccountId),
            eq(schema.postTargets.platformPostId, platformPostId)
          ),
          with: {
            post: true,
          },
        });
        if (target?.post) {
          postContent = target.post.content;
        }
      }

      try {
        const model = getGeminiModel();
        const systemPrompt = `You are a professional social media manager assistant. Write a short, engaging, and friendly response to a user comment on ${account.platform}.
        
Context:
- Original Post Content: "${postContent}"
- User Comment: "${commentText}"
- Commenter Username: "${commentUsername}"

Guidelines:
- Keep the reply concise and professional.
- Max 250 characters.
- Do not use quotes or hashtags unless highly relevant.
- Address the user directly if appropriate.
- Return ONLY the response text.`;

        const result = await model.generateContent(systemPrompt);
        replyText = result.response.text().trim();
        
        // Strip out enclosing quotes if Gemini added them
        if (replyText.startsWith('"') && replyText.endsWith('"')) {
          replyText = replyText.substring(1, replyText.length - 1);
        }
      } catch (aiError) {
        console.error("[Auto-Reply Worker] Gemini AI generation failed, falling back to static template:", aiError);
        // Fallback to responseTemplate if AI fails
        replyText = rule.responseTemplate || `Hi @${commentUsername}, thanks for the comment!`;
      }
    } else {
      console.log("[Auto-Reply Worker] Using response template...");
      // Replace {username} variable
      replyText = rule.responseTemplate.replace(/{username}/g, commentUsername);
    }

    if (!replyText) {
      console.warn("[Auto-Reply Worker] Generated reply text is empty. Skipping.");
      return;
    }

    // 4. Publish reply via platform API
    console.log(`[Auto-Reply Worker] Publishing reply to ${account.platform}: "${replyText}"`);
    const replyPlatformId = await publishCommentReply(
      account.platform as SupportedPlatform,
      account.accessToken,
      commentId,
      replyText,
      account.platformUserId,
      platformPostId
    );

    // 5. Log reply to database
    await db.insert(schema.autoReplyLogs).values({
      ruleId: rule.id,
      platform: account.platform,
      commentId: commentId,
      postId: platformPostId,
      response: replyText,
    });

    console.log(`[Auto-Reply Worker] Successfully replied and logged for comment ${commentId}. Reply ID: ${replyPlatformId}`);
  },
  {
    connection: getRedisConnectionOptions(),
    concurrency: 5,
  }
);

autoReplyWorker.on("failed", (job, err) => {
  console.error(`[Auto-Reply Worker] Job failed: ${job?.id}. Error: ${err.message}`);
});

autoReplyWorker.on("completed", (job) => {
  console.log(`[Auto-Reply Worker] Job completed successfully: ${job?.id}`);
});
