export type SubscriptionPlan = "free" | "pro" | "agency";

export interface PlanLimit {
  maxConnectedAccounts: number;
  maxPostsPerMonth: number;
  aiEnabled: boolean;
  autoReplyEnabled: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimit> = {
  free: {
    maxConnectedAccounts: 3,
    maxPostsPerMonth: 10,
    aiEnabled: false,
    autoReplyEnabled: false,
  },
  pro: {
    maxConnectedAccounts: 10,
    maxPostsPerMonth: Infinity,
    aiEnabled: true,
    autoReplyEnabled: true,
  },
  agency: {
    maxConnectedAccounts: Infinity,
    maxPostsPerMonth: Infinity,
    aiEnabled: true,
    autoReplyEnabled: true,
  },
};
