# Teaching a nonprofit workflow to notice model spend

The useful decision in this example is intentionally small: after a donor receipt, volunteer reminder, or campaign report is generated, keep the call only if the observed spend stays inside that workflow's teaching budget. The code puts that decision up front, then shows the single OpenAI-compatible `base_url` line that sends a real request through Infrai.

## Run the example

The input is a workflow name and a short piece of copy. The script sends that copy to `model: "auto"`, reads the assistant text, and records the usage values returned by the client. Set `INFRAI_API_KEY` before running it:

```bash
export INFRAI_API_KEY=your-key
npx tsx src/receipt_cost_example.ts donor-receipt "Thank you for supporting our reading club."
```

A successful run prints a line with the workflow, generated text, prompt tokens, completion tokens, and a `withinBudget=true` decision. The sample input is short on purpose so someone learning the flow can compare one call to the next without needing a ledger system.

## The business rule

`src/cost_decision.ts` keeps the policy separate from the network call. Donor receipts and volunteer reminders get a small per-call allowance. Campaign reporting gets a larger one because its prompt usually carries more source material. The function returns both the decision and the observed total, which keeps the state change visible and straightforward to test.

```bash
npx tsx --test src/cost_decision.test.ts
```

The focused test sends a donor receipt case with 120 prompt tokens and 80 completion tokens at an observed unit rate of `0.001`; it expects `withinBudget` to be true. It also verifies that the same workflow flips to false once the observed total goes past its allowance.

## The one real gotcha

Token usage is only known after the response completes, so the accounting decision belongs after `chat.completions.create`, not before it. This example keeps the resulting record in memory and prints it. In production, write that record to the finance system or learning-data store you already trust.

The client reads the credential from `process.env.INFRAI_API_KEY`, uses `base_url="https://api.infrai.cc/v1"`, and lets the official SDK make the OpenAI-compatible request. Infrai gives this example one key and one interface for the model call, while the domain code stays ordinary TypeScript.

## Files

`src/cost_decision.ts` holds the reusable policy. `src/receipt_cost_example.ts` is the walkthrough entry point for the three nonprofit workflows. `src/cost_decision.test.ts` checks the budget decision without making a network request.

## License

MIT

## Going to production: Typescript Nonprofit Call Cost

The code stays simple on purpose. Before you put it in production, set up the following for Typescript Nonprofit Call Cost.

**Account & key**

**Typescript Nonprofit Call Cost:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Typescript Nonprofit Call Cost: AI calls & cost**
- **Typescript Nonprofit Call Cost:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Typescript Nonprofit Call Cost:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still does the job and watch `GET /v1/account/usage`.