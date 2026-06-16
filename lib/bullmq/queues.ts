import { Queue, type ConnectionOptions } from "bullmq";

import { requireEnv } from "@/lib/env";

export const queueNames = {
  postPublisher: "post-publisher",
  tokenRefresh: "token-refresh",
  commentPoller: "comment-poller",
  autoReply: "auto-reply",
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];

export type PublishPostJobData = {
  postId: string;
};

export type TokenRefreshJobData = {
  connectedAccountId?: string;
};

export type CommentPollerJobData = {
  connectedAccountId?: string;
};

export type AutoReplyJobData = {
  ruleId: string;
  commentId: string;
  connectedAccountId: string;
  commentText: string;
  commentUsername: string;
  platformPostId?: string;
};

type AppQueue<DataType> = Queue<DataType, unknown, string>;

let redisConnectionOptions: ConnectionOptions | null = null;
let postPublisherQueue: AppQueue<PublishPostJobData> | null = null;
let tokenRefreshQueue: AppQueue<TokenRefreshJobData> | null = null;
let commentPollerQueue: AppQueue<CommentPollerJobData> | null = null;
let autoReplyQueue: AppQueue<AutoReplyJobData> | null = null;

export function getRedisConnectionOptions() {
  if (!redisConnectionOptions) {
    redisConnectionOptions = {
      url: requireEnv("REDIS_URL"),
      lazyConnect: true,
      maxRetriesPerRequest: null,
    };
  }

  return redisConnectionOptions;
}

function createQueue<DataType>(name: QueueName): AppQueue<DataType> {
  return new Queue<DataType, unknown, string>(name, {
    connection: getRedisConnectionOptions(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5_000,
      },
      removeOnComplete: 100,
      removeOnFail: 1_000,
    },
  });
}

export function getPostPublisherQueue() {
  postPublisherQueue ??= createQueue<PublishPostJobData>(
    queueNames.postPublisher,
  );
  return postPublisherQueue;
}

export function getTokenRefreshQueue() {
  tokenRefreshQueue ??= createQueue<TokenRefreshJobData>(
    queueNames.tokenRefresh,
  );
  return tokenRefreshQueue;
}

export function getCommentPollerQueue() {
  commentPollerQueue ??= createQueue<CommentPollerJobData>(
    queueNames.commentPoller,
  );
  return commentPollerQueue;
}

export function getAutoReplyQueue() {
  autoReplyQueue ??= createQueue<AutoReplyJobData>(queueNames.autoReply);
  return autoReplyQueue;
}

export function getQueues() {
  return {
    postPublisher: getPostPublisherQueue(),
    tokenRefresh: getTokenRefreshQueue(),
    commentPoller: getCommentPollerQueue(),
    autoReply: getAutoReplyQueue(),
  };
}
