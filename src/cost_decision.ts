export type Workflow = "donor-receipt" | "volunteer-reminder" | "campaign-report";

export type UsageRecord = {
  workflow: Workflow;
  promptTokens: number;
  completionTokens: number;
  unitRate: number;
};

const budgets: Record<Workflow, number> = {
  "donor-receipt": 0.25,
  "volunteer-reminder": 0.2,
  "campaign-report": 1,
};

export function decideSpend(record: UsageRecord): { total: number; withinBudget: boolean } {
  const total = (record.promptTokens + record.completionTokens) * record.unitRate;
  return { total, withinBudget: total <= budgets[record.workflow] };
}
