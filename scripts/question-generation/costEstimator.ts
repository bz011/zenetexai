/**
 * Rough cost estimation. Rates are illustrative placeholders based on
 * publicly-listed OpenAI pricing at the time this was written - provider
 * pricing changes over time, so treat estimated_cost_usd as directional,
 * not billing-accurate. Update these constants when rates change rather
 * than trusting them indefinitely.
 */
const RATES_PER_MILLION_TOKENS: Record<string, { prompt: number; completion: number }> = {
  "gpt-4o-2024-08-06": { prompt: 2.5, completion: 10 },
  "text-embedding-3-small": { prompt: 0.02, completion: 0 },
};

export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const rates = RATES_PER_MILLION_TOKENS[model] ?? { prompt: 2.5, completion: 10 };
  return (promptTokens * rates.prompt + completionTokens * rates.completion) / 1_000_000;
}
