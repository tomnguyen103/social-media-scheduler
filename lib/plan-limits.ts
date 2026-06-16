import { PLAN_LIMITS as BILLING_PLAN_LIMITS, type SubscriptionPlan } from "./billing/plans";

export interface PlanLimit {
  maxAccounts: number;
  unlimitedAccounts: boolean;
  hasAI: boolean;
  maxPostsPerMonth: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimit> = {
  free: {
    maxAccounts: BILLING_PLAN_LIMITS.free.maxConnectedAccounts,
    unlimitedAccounts: BILLING_PLAN_LIMITS.free.maxConnectedAccounts === Infinity,
    hasAI: BILLING_PLAN_LIMITS.free.aiEnabled,
    maxPostsPerMonth: BILLING_PLAN_LIMITS.free.maxPostsPerMonth,
  },
  pro: {
    maxAccounts: BILLING_PLAN_LIMITS.pro.maxConnectedAccounts,
    unlimitedAccounts: BILLING_PLAN_LIMITS.pro.maxConnectedAccounts === Infinity,
    hasAI: BILLING_PLAN_LIMITS.pro.aiEnabled,
    maxPostsPerMonth: BILLING_PLAN_LIMITS.pro.maxPostsPerMonth,
  },
  agency: {
    maxAccounts: BILLING_PLAN_LIMITS.agency.maxConnectedAccounts,
    unlimitedAccounts: BILLING_PLAN_LIMITS.agency.maxConnectedAccounts === Infinity,
    hasAI: BILLING_PLAN_LIMITS.agency.aiEnabled,
    maxPostsPerMonth: BILLING_PLAN_LIMITS.agency.maxPostsPerMonth,
  },
};
