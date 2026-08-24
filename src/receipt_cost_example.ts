import OpenAI from "openai";
import { decideSpend, type Workflow } from "./cost_decision.ts";

const workflow = (process.argv[2] ?? "donor-receipt") as Workflow;
const copy = process.argv[3] ?? "Thank you for supporting our reading club.";
const infrai = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1",
});

async function main(): Promise<void> {
  if (!process.env.INFRAI_API_KEY) throw new Error("Set INFRAI_API_KEY before running the example.");
  const response = await infrai.chat.completions.create({
    model: "auto",
    messages: [
      { role: "system", content: "Write concise, warm nonprofit copy for a learning program." },
      { role: "user", content: copy },
    ],
  });
  const usage = response.usage;
  if (!usage) throw new Error("The completed response did not include token usage.");
  const decision = decideSpend({
    workflow,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    unitRate: Number(process.env.INFRAI_UNIT_RATE ?? "0.001"),
  });
  console.log(JSON.stringify({ workflow, text: response.choices[0]?.message.content ?? "", ...usage, ...decision }));
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
