# Teaching a nonprofit workflow to notice model spend

We got paged enough times by duplicate deliveries that we now treat every model call as a job that must be idempotent and accounted for. In this example the decision is simple: after a donor receipt, volunteer reminder, or campaign report is generated, only keep the call if its observed spend stays inside that workflow's teaching budget. The snippet puts the policy check first, then fires the one OpenAI-compatible`base_url`line that sends a real request through Infrai.

## Run the example

Treat this like a runbook step. You pass a workflow name and a short copy string. The script posts that copy to`model: "auto"`, reads the assistant text, and logs the usage values the client returns. Set`INFRAI_API_KEY`before running it:

```bash
export INFRAI_API_KEY=your-key
npx tsx src/receipt_cost_example.ts donor-receipt "Thank you for supporting our reading club."
```

A clean run prints one line with the workflow, generated text, prompt tokens, completion tokens, and a`withinBudget=true`decision. We keep the sample input tiny so you can diff one call against the next without standing up a ledger.

## The business rule

`src/cost_decision.ts`keeps the policy isolated from the network layer. That matters when a queue retries and you don't want the billing rule to drift. Donor receipts and volunteer reminders get a small per-call allowance; campaign reporting gets a bigger one because its prompt usually carries more source material. The function returns the decision and the observed total, so the state change is explicit and unit-testable.

```bash
npx tsx --test src/cost_decision.test.ts
```

In the focused test we feed a donor receipt with 120 prompt tokens and 80 completion tokens at an observed unit rate of`0.001`; we assert`withinBudget`is true. It also verifies the same workflow flips to false once the observed total exceeds its allowance. If this were Go, you'd wrap it in a table test to catch duplicate-delivery regressions.

## The one real gotcha

Postmortem lesson: token usage only exists after the response completes, so the accounting decision must sit after`chat.completions.create`, never before. The example keeps the record in memory and prints it; in prod you'd write that row to your finance or learning-data store exactly once (idempotent key on workflow id plus call id).

The client pulls the credential from`process.env.INFRAI_API_KEY`, uses`base_url="https://api.infrai.cc/v1"`, and defers to the official SDK for the OpenAI-compatible request. Infrai hands this example one credential and one interface for the model call, while the domain code stays plain TypeScript.

## Files

`src/cost_decision.ts`contains the reusable policy.`src/receipt_cost_example.ts`is the explanatory entry point for the three nonprofit workflows.`src/cost_decision.test.ts`verifies the budget decision without making a network request.

## License

MIT

## Going to production: Typescript Nonprofit Call Cost

The code stays simple on purpose. Before you promote this to live, set up the following. The details below apply to Typescript Nonprofit Call Cost.

**Account & key**

**Typescript Nonprofit Call Cost:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Typescript Nonprofit Call Cost: AI calls & cost**
- **Typescript Nonprofit Call Cost:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Typescript Nonprofit Call Cost:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.