import assert from "node:assert/strict";
import { describe, it } from "node:test";

// The trigger evaluation logic extracted from comment-poller.ts for unit testing
function evaluateTrigger(
  rule: { triggerType: string; keywords: string[] },
  comment: { id: string; text: string; createdAt: Date },
  platformPostId: string,
  allComments: Array<{ id: string; text: string; createdAt: Date }>,
  hasAlreadyRepliedToPost: boolean
): boolean {
  if (rule.triggerType === "keyword_match") {
    const commentTextLower = comment.text.toLowerCase();
    return rule.keywords.some((kw) =>
      commentTextLower.includes(kw.toLowerCase())
    );
  } else if (rule.triggerType === "any_comment") {
    return true;
  } else if (rule.triggerType === "first_comment") {
    if (hasAlreadyRepliedToPost) {
      return false;
    }
    // Sort comments to find the earliest
    const sortedComments = [...allComments].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    const earliestComment = sortedComments[0];
    return !!(earliestComment && earliestComment.id === comment.id);
  }
  return false;
}

describe("Auto-Reply Worker - Trigger Evaluation", () => {
  describe("Keyword Match Trigger", () => {
    const rule = {
      triggerType: "keyword_match",
      keywords: ["pricing", "cost", "how much"],
    };

    it("should match when comment contains a keyword case-insensitively", () => {
      const comment = { id: "c1", text: "How much does it cost?", createdAt: new Date() };
      const result = evaluateTrigger(rule, comment, "post1", [comment], false);
      assert.equal(result, true);
    });

    it("should match when comment text exactly contains a keyword", () => {
      const comment = { id: "c1", text: "pricing", createdAt: new Date() };
      const result = evaluateTrigger(rule, comment, "post1", [comment], false);
      assert.equal(result, true);
    });

    it("should not match when comment does not contain any keyword", () => {
      const comment = { id: "c1", text: "Looks great, nice job!", createdAt: new Date() };
      const result = evaluateTrigger(rule, comment, "post1", [comment], false);
      assert.equal(result, false);
    });
  });

  describe("Any Comment Trigger", () => {
    const rule = {
      triggerType: "any_comment",
      keywords: [],
    };

    it("should match any comment", () => {
      const comment = { id: "c1", text: "Nice work", createdAt: new Date() };
      const result = evaluateTrigger(rule, comment, "post1", [comment], false);
      assert.equal(result, true);
    });
  });

  describe("First Comment Trigger", () => {
    const rule = {
      triggerType: "first_comment",
      keywords: [],
    };

    const c1 = { id: "c1", text: "First comment!", createdAt: new Date("2026-06-16T12:00:00Z") };
    const c2 = { id: "c2", text: "Second comment!", createdAt: new Date("2026-06-16T12:05:00Z") };
    const allComments = [c2, c1]; // unordered

    it("should match the earliest comment if no reply has been sent yet", () => {
      const result = evaluateTrigger(rule, c1, "post1", allComments, false);
      assert.equal(result, true);
    });

    it("should not match later comments even if no reply has been sent yet", () => {
      const result = evaluateTrigger(rule, c2, "post1", allComments, false);
      assert.equal(result, false);
    });

    it("should not match the earliest comment if we already replied to this post", () => {
      const result = evaluateTrigger(rule, c1, "post1", allComments, true);
      assert.equal(result, false);
    });
  });
});
