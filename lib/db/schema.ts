import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "pro",
  "agency",
]);

export const socialPlatformEnum = pgEnum("social_platform", [
  "instagram",
  "youtube",
  "tiktok",
  "facebook",
  "linkedin",
  "pinterest",
  "discord",
  "twitter",
  "slack",
]);

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "scheduled",
  "published",
  "failed",
  "partial_failure",
]);

export const postTargetStatusEnum = pgEnum("post_target_status", [
  "pending",
  "published",
  "failed",
  "skipped",
]);

export const autoReplyTriggerEnum = pgEnum("auto_reply_trigger", [
  "keyword_match",
  "any_comment",
  "first_comment",
]);

export const scheduledJobStatusEnum = pgEnum("scheduled_job_status", [
  "waiting",
  "active",
  "completed",
  "failed",
  "canceled",
]);

export const users = pgTable(
  "users",
  {
    clerkUserId: text("clerk_user_id").primaryKey(),
    email: text("email").notNull(),
    plan: subscriptionPlanEnum("plan").notNull().default("free"),
    emailOnFailure: boolean("email_on_failure").notNull().default(true),
    weeklyDigest: boolean("weekly_digest").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const connectedAccounts = pgTable(
  "connected_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    platform: socialPlatformEnum("platform").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    platformUserId: text("platform_user_id").notNull(),
    platformUsername: text("platform_username").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
    scopes: text("scopes")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("connected_accounts_user_idx").on(table.clerkUserId),
    uniqueIndex("connected_accounts_platform_user_idx").on(
      table.clerkUserId,
      table.platform,
      table.platformUserId,
    ),
  ],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    content: text("content").notNull(),
    mediaUrls: text("media_urls")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    status: postStatusEnum("status").notNull().default("draft"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("posts_user_idx").on(table.clerkUserId),
    index("posts_status_idx").on(table.status),
    index("posts_scheduled_at_idx").on(table.scheduledAt),
  ],
);

export const postTargets = pgTable(
  "post_targets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    connectedAccountId: uuid("connected_account_id")
      .notNull()
      .references(() => connectedAccounts.id, { onDelete: "cascade" }),
    status: postTargetStatusEnum("status").notNull().default("pending"),
    platformPostId: text("platform_post_id"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("post_targets_post_idx").on(table.postId),
    index("post_targets_connected_account_idx").on(table.connectedAccountId),
    uniqueIndex("post_targets_post_account_idx").on(
      table.postId,
      table.connectedAccountId,
    ),
  ],
);

export const autoReplyRules = pgTable(
  "auto_reply_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    name: text("name").notNull(),
    triggerType: autoReplyTriggerEnum("trigger_type").notNull(),
    keywords: text("keywords")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    responseTemplate: text("response_template").notNull(),
    useAI: boolean("use_ai").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    platformAccountIds: uuid("platform_account_ids")
      .array()
      .notNull()
      .default(sql`ARRAY[]::uuid[]`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auto_reply_rules_user_idx").on(table.clerkUserId),
    index("auto_reply_rules_active_idx").on(table.isActive),
  ],
);

export const autoReplyLogs = pgTable(
  "auto_reply_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => autoReplyRules.id, { onDelete: "cascade" }),
    platform: socialPlatformEnum("platform").notNull(),
    commentId: text("comment_id").notNull(),
    postId: text("post_id"),
    response: text("response").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("auto_reply_logs_rule_idx").on(table.ruleId),
    index("auto_reply_logs_comment_idx").on(table.commentId),
    uniqueIndex("auto_reply_logs_comment_rule_idx").on(table.commentId, table.ruleId),
  ],
);

export const scheduledJobs = pgTable(
  "scheduled_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    bullmqJobId: text("bullmq_job_id").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: scheduledJobStatusEnum("status").notNull().default("waiting"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("scheduled_jobs_post_idx").on(table.postId),
    uniqueIndex("scheduled_jobs_bullmq_job_idx").on(table.bullmqJobId),
    index("scheduled_jobs_scheduled_at_idx").on(table.scheduledAt),
  ],
);

export const analyticsCache = pgTable(
  "analytics_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postTargetId: uuid("post_target_id")
      .notNull()
      .references(() => postTargets.id, { onDelete: "cascade" }),
    reach: integer("reach").notNull().default(0),
    impressions: integer("impressions").notNull().default(0),
    likes: integer("likes").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    shares: integer("shares").notNull().default(0),
    engagement: integer("engagement").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("analytics_cache_post_target_idx").on(table.postTargetId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  connectedAccounts: many(connectedAccounts),
  posts: many(posts),
  autoReplyRules: many(autoReplyRules),
}));

export const connectedAccountsRelations = relations(
  connectedAccounts,
  ({ many, one }) => ({
    user: one(users, {
      fields: [connectedAccounts.clerkUserId],
      references: [users.clerkUserId],
    }),
    postTargets: many(postTargets),
  }),
);

export const postsRelations = relations(posts, ({ many, one }) => ({
  user: one(users, {
    fields: [posts.clerkUserId],
    references: [users.clerkUserId],
  }),
  targets: many(postTargets),
  scheduledJob: one(scheduledJobs),
}));

export const postTargetsRelations = relations(postTargets, ({ one }) => ({
  post: one(posts, {
    fields: [postTargets.postId],
    references: [posts.id],
  }),
  connectedAccount: one(connectedAccounts, {
    fields: [postTargets.connectedAccountId],
    references: [connectedAccounts.id],
  }),
  analyticsCache: one(analyticsCache),
}));

export const autoReplyRulesRelations = relations(autoReplyRules, ({ one, many }) => ({
  user: one(users, {
    fields: [autoReplyRules.clerkUserId],
    references: [users.clerkUserId],
  }),
  logs: many(autoReplyLogs),
}));

export const autoReplyLogsRelations = relations(autoReplyLogs, ({ one }) => ({
  rule: one(autoReplyRules, {
    fields: [autoReplyLogs.ruleId],
    references: [autoReplyRules.id],
  }),
}));

export const scheduledJobsRelations = relations(scheduledJobs, ({ one }) => ({
  post: one(posts, {
    fields: [scheduledJobs.postId],
    references: [posts.id],
  }),
}));

export const analyticsCacheRelations = relations(analyticsCache, ({ one }) => ({
  postTarget: one(postTargets, {
    fields: [analyticsCache.postTargetId],
    references: [postTargets.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type NewConnectedAccount = typeof connectedAccounts.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostTarget = typeof postTargets.$inferSelect;
export type NewPostTarget = typeof postTargets.$inferInsert;
export type AutoReplyRule = typeof autoReplyRules.$inferSelect;
export type NewAutoReplyRule = typeof autoReplyRules.$inferInsert;
export type AutoReplyLog = typeof autoReplyLogs.$inferSelect;
export type NewAutoReplyLog = typeof autoReplyLogs.$inferInsert;
export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type NewScheduledJob = typeof scheduledJobs.$inferInsert;
export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type NewAnalyticsCache = typeof analyticsCache.$inferInsert;
