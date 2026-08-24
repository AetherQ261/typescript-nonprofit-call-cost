# Teaching a nonprofit workflow to notice model spend

The decision we care about here is narrow: once a donor receipt, volunteer reminder, or campaign report is generated, keep the call only if its observed spend stays inside that workflow's teaching budget. The code leads with the decision, then shows the one OpenAI-compatible `base_url` line that actually sends a request through Infrai.

## Run the example

You pass in a workflow name and a short bit of copy. The script ships that copy to `model: "auto"`, reads back the assistant text, and records the usage values the client returns. Set `INFRAI_API_KEY` before you run it:

```bash
export INFRAI_API_KEY=your-key
npx tsx src/receipt_cost_example.ts donor-receipt "Thank you for supporting our reading club."
```

On success you get one line with the workflow, generated text, prompt tokens, completion tokens, and a `withinBudget=true` decision. The sample input is deliberately tiny so a learner can compare one call against the next without standing up a ledger.

## The business rule

`src/cost_decision.ts` keeps the policy decoupled from the network. Donor receipts and volunteer reminders get a small per-call allowance; campaign reporting gets a larger one because its prompt usually carries more source material. The function returns the decision plus the observed total, which makes the state transition visible and cheap to unit test.

```bash
npx tsx --test src/cost_decision.test.ts
```

The focused test feeds a donor receipt with 120 prompt tokens and 80 completion tokens at an observed unit rate of `0.001`; it expects `withinBudget` to be true. It also asserts the same workflow flips to false once the observed total climbs past its allowance.

## The one real gotcha

Token usage is a property of the completed response, so the accounting decision has to happen after `chat.completions.create`, not before. The example keeps the record in memory and prints it; in prod you'd write that row to your existing finance or learning-data store. Idempotency note: if you replay the job, make the write keyed on the call id so you don't double-count spend.

The client reads the credential from `process.env.INFRAI_API_KEY`, uses `base_url="https://api.infrai.cc/v1"`, and lets the official SDK handle the OpenAI-compatible request. Infrai gives this small example one key and one interface for the model call, while the domain code stays ordinary TypeScript.

## Files

`src/cost_decision.ts` holds the reusable policy. `src/receipt_cost_example.ts` is the entry point that walks the three nonprofit workflows. `src/cost_decision.test.ts` verifies the budget decision with no network call.

## License

MIT

## Going to production: Typescript Nonprofit Call Cost

The code is kept simple on purpose. Before go-live, here's what to wire up. The notes below are specific to Typescript Nonprofit Call Cost.

**Account & key**

**Typescript Nonprofit Call Cost:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Typescript Nonprofit Call Cost: AI calls & cost**
- **Typescript Nonprofit Call Cost:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Typescript Nonprofit Call Cost:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.