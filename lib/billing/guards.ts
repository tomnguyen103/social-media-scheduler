import { checkPostCreationLimit, checkConnectedAccountsLimit, getUserPlan } from "@/lib/plan";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export async function checkPostLimit(userId: string): Promise<void> {
  const check = await checkPostCreationLimit(userId);
  if (!check.allowed) {
    throw new PlanLimitError(
      `Post limit reached for the ${check.plan} plan (max ${check.max} posts/month). Please upgrade.`
    );
  }
}

export async function checkAccountLimit(userId: string): Promise<void> {
  const check = await checkConnectedAccountsLimit(userId);
  if (!check.allowed) {
    throw new PlanLimitError(
      `Account limit reached for the ${check.plan} plan (max ${check.max} accounts). Please upgrade.`
    );
  }
}

export async function requireAI(userId: string): Promise<void> {
  const plan = await getUserPlan(userId);
  if (plan === "free") {
    throw new PlanLimitError(
      "AI features require a Pro or Agency subscription. Please upgrade."
    );
  }
}
