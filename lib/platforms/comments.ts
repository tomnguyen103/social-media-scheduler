import { decrypt } from "@/lib/crypto";
import { type SupportedPlatform } from "./index";

export type PlatformComment = {
  id: string;
  text: string;
  username: string;
  createdAt: Date;
  postId?: string;
};

interface InstagramCommentItem {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}

interface FacebookCommentItem {
  id: string;
  message: string;
  from?: { name: string };
  created_time: string;
}

interface YouTubeCommentItem {
  id: string;
  snippet?: {
    topLevelComment?: {
      id: string;
      snippet?: {
        textOriginal: string;
        authorDisplayName: string;
        publishedAt: string;
      };
    };
  };
}

interface DiscordMessageItem {
  id: string;
  content: string;
  author?: {
    id: string;
    username: string;
  };
  timestamp: string;
}

interface SlackMessageItem {
  client_msg_id?: string;
  ts: string;
  text: string;
  user?: string;
}

interface TwitterTweetItem {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
}

interface TwitterUserItem {
  id: string;
  username: string;
}

export async function fetchRecentComments(
  platform: SupportedPlatform,
  encryptedAccessToken: string,
  platformPostId: string,
  platformUserId: string
): Promise<PlatformComment[]> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (
    accessToken.startsWith("mock_access_token_") ||
    accessToken === "mock_access_token"
  ) {
    // Return mock comments for testing
    // We can vary the comments slightly based on the post ID or timestamp to make them dynamic
    return [
      {
        id: `mock_comment_${platformPostId}_pricing`,
        text: "Hey! What is the pricing or cost for this service? How much is it?",
        username: "alice_mock",
        createdAt: new Date(),
        postId: platformPostId,
      },
      {
        id: `mock_comment_${platformPostId}_spam`,
        text: "Please follow back, spam spam!",
        username: "spammer_mock",
        createdAt: new Date(),
        postId: platformPostId,
      },
      {
        id: `mock_comment_${platformPostId}_first`,
        text: "First comment! Love the product.",
        username: "first_commenter",
        createdAt: new Date(),
        postId: platformPostId,
      },
    ];
  }

  // Real Platform API implementation
  try {
    switch (platform.toLowerCase()) {
      case "instagram": {
        // Fetch comments for media from Instagram Graph API
        const url = `https://graph.facebook.com/v18.0/${platformPostId}/comments?fields=id,text,username,timestamp&access_token=${accessToken}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Instagram API error: ${errorData.error?.message || res.statusText}`);
        }
        const data = (await res.json()) as { data?: InstagramCommentItem[] };
        return (data.data || []).map((item) => ({
          id: item.id,
          text: item.text,
          username: item.username,
          createdAt: new Date(item.timestamp),
          postId: platformPostId,
        }));
      }

      case "facebook": {
        const url = `https://graph.facebook.com/v18.0/${platformPostId}/comments?fields=id,message,from,created_time&access_token=${accessToken}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Facebook API error: ${errorData.error?.message || res.statusText}`);
        }
        const data = (await res.json()) as { data?: FacebookCommentItem[] };
        return (data.data || []).map((item) => ({
          id: item.id,
          text: item.message,
          username: item.from?.name || "anonymous",
          createdAt: new Date(item.created_time),
          postId: platformPostId,
        }));
      }

      case "youtube": {
        // platformPostId is videoId
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${platformPostId}&maxResults=10`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`YouTube API error: ${errorData.error?.message || res.statusText}`);
        }
        const data = (await res.json()) as { items?: YouTubeCommentItem[] };
        return (data.items || []).map((item) => {
          const topComment = item.snippet?.topLevelComment?.snippet;
          return {
            id: item.snippet?.topLevelComment?.id || item.id,
            text: topComment?.textOriginal || "",
            username: topComment?.authorDisplayName || "anonymous",
            createdAt: new Date(topComment?.publishedAt || Date.now()),
            postId: platformPostId,
          };
        });
      }

      case "discord": {
        // Channel ID is platformUserId. Since Discord is a chat, we can fetch recent messages
        const res = await fetch(`https://discord.com/api/v10/channels/${platformUserId}/messages?limit=20`, {
          headers: {
            Authorization: accessToken.startsWith("Bot ") ? accessToken : `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Discord API error: ${errorData.message || res.statusText}`);
        }
        const data = (await res.json()) as DiscordMessageItem[];
        // Filter out messages that are sent by the bot/user itself to prevent self-replying loop
        const userMessages = data.filter((msg) => msg.author?.id !== platformUserId);
        return userMessages.map((msg) => ({
          id: msg.id,
          text: msg.content,
          username: msg.author?.username || "user",
          createdAt: new Date(msg.timestamp),
          postId: platformPostId,
        }));
      }

      case "slack": {
        // platformPostId is the timestamp (ts) of the original post
        // platformUserId is the channel ID
        const url = `https://slack.com/api/conversations.replies?channel=${platformUserId}&ts=${platformPostId}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        const data = (await res.json()) as { ok: boolean; error?: string; messages?: SlackMessageItem[] };
        if (!res.ok || !data.ok) {
          throw new Error(`Slack API error: ${data.error || res.statusText}`);
        }
        // Slack replies in thread. Filter out bot messages/our messages.
        const messages = data.messages || [];
        // First message in thread is the main post, comments are subsequent ones
        const replies = messages.slice(1);
        return replies.map((msg) => ({
          id: msg.client_msg_id || msg.ts,
          text: msg.text,
          username: msg.user || "user",
          createdAt: new Date(parseFloat(msg.ts) * 1000),
          postId: platformPostId,
        }));
      }

      case "twitter": {
        // Search for recent tweets replying to the tweet ID (platformPostId)
        const url = `https://api.twitter.com/2/tweets/search/recent?query=conversation_id:${platformPostId}&tweet.fields=created_at,author_id&expansions=author_id`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Twitter API error: ${errorData.error?.message || res.statusText}`);
        }
        const data = (await res.json()) as { data?: TwitterTweetItem[]; includes?: { users?: TwitterUserItem[] } };
        const tweets = data.data || [];
        const tweetUsers = data.includes?.users || [];
        return tweets.map((tweet) => {
          const author = tweetUsers.find((u) => u.id === tweet.author_id);
          return {
            id: tweet.id,
            text: tweet.text,
            username: author?.username || tweet.author_id,
            createdAt: new Date(tweet.created_at),
            postId: platformPostId,
          };
        });
      }

      case "tiktok":
      case "linkedin":
      default:
        console.warn(`Real API polling not fully implemented for platform: ${platform}. Using fallback.`);
        return [];
    }
  } catch (err) {
    console.error(`Error fetching comments from ${platform}:`, err);
    throw err;
  }
}

export async function publishCommentReply(
  platform: SupportedPlatform,
  encryptedAccessToken: string,
  commentId: string,
  replyContent: string,
  platformUserId: string,
  platformPostId?: string
): Promise<string> {
  const accessToken = decrypt(encryptedAccessToken);

  // Check for Mock Mode
  if (
    accessToken.startsWith("mock_access_token_") ||
    accessToken === "mock_access_token"
  ) {
    console.log(`[Mock Reply] Posted reply to ${platform} comment ${commentId}: "${replyContent}"`);
    return `mock_reply_id_${Math.floor(Math.random() * 10000000)}`;
  }

  try {
    switch (platform.toLowerCase()) {
      case "instagram": {
        // Post reply to an Instagram comment ID
        const url = `https://graph.facebook.com/v18.0/${commentId}/replies`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: replyContent,
            access_token: accessToken,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Instagram reply failed: ${errorData.error?.message || res.statusText}`);
        }
        const data = (await res.json()) as { id: string };
        return data.id;
      }

      case "facebook": {
        const url = `https://graph.facebook.com/v18.0/${commentId}/comments`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: replyContent,
            access_token: accessToken,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Facebook reply failed: ${errorData.error?.message || res.statusText}`);
        }
        const data = (await res.json()) as { id: string };
        return data.id;
      }

      case "youtube": {
        const url = `https://www.googleapis.com/youtube/v3/comments?part=snippet`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: {
              parentId: commentId,
              textOriginal: replyContent,
            },
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`YouTube reply failed: ${errorData.error?.message || res.statusText}`);
        }
        const data = (await res.json()) as { id: string };
        return data.id;
      }

      case "discord": {
        // Reply to a message in channel platformUserId (commentId is the message we reply to)
        const res = await fetch(`https://discord.com/api/v10/channels/${platformUserId}/messages`, {
          method: "POST",
          headers: {
            Authorization: accessToken.startsWith("Bot ") ? accessToken : `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: replyContent,
            message_reference: {
              message_id: commentId,
            },
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Discord reply failed: ${errorData.message || res.statusText}`);
        }
        const data = (await res.json()) as { id: string };
        return data.id;
      }

      case "slack": {
        // Reply to Slack thread (platformPostId is thread ts, platformUserId is channel)
        const res = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify({
            channel: platformUserId,
            text: replyContent,
            thread_ts: platformPostId,
          }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string; ts: string };
        if (!res.ok || !data.ok) {
          throw new Error(`Slack reply failed: ${data.error || res.statusText}`);
        }
        return data.ts;
      }

      case "twitter": {
        const res = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: replyContent,
            reply: {
              in_reply_to_tweet_id: commentId,
            },
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(`Twitter reply failed: ${errorData.error?.message || res.statusText}`);
        }
        const data = (await res.json()) as { data: { id: string } };
        return data.data.id;
      }

      case "tiktok":
      case "linkedin":
      default:
        console.warn(`Real API replying not fully implemented for platform: ${platform}. Using mock.`);
        return `mock_fallback_reply_${Math.floor(Math.random() * 10000000)}`;
    }
  } catch (err) {
    console.error(`Error replying to comment on ${platform}:`, err);
    throw err;
  }
}
