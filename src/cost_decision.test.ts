import assert from "node:assert/strict";
import test from "node:test";
import { decideSpend } from "./cost_decision.ts";

test("a donor receipt stays accepted until its call allowance is crossed", () => {
  const accepted = decideSpend({ workflow: "donor-receipt", promptTokens: 120, completionTokens: 80, unitRate: 0.001 });
  assert.deepEqual(accepted, { total: 0.2, withinBudget: true });

  const review = decideSpend({ workflow: "donor-receipt", promptTokens: 180, completionTokens: 100, unitRate: 0.001 });
  assert.equal(review.withinBudget, false);
});
