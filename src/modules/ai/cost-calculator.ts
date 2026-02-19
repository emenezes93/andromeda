/**
 * Cost calculator for LLM providers.
 * Estimates cost based on input/output tokens and provider pricing.
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CostEstimate {
  estimatedCostUsd: number;
}

// Pricing per million tokens (as of 2025)
const PRICING = {
  openai: {
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4-turbo': { input: 10.0, output: 30.0 },
    'gpt-4': { input: 30.0, output: 60.0 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  },
  anthropic: {
    'claude-sonnet-4-5': { input: 3.0, output: 15.0 },
    'claude-opus-4': { input: 15.0, output: 75.0 },
    'claude-haiku-4-5': { input: 1.0, output: 5.0 },
  },
} as const;

/**
 * Calculate estimated cost in USD for a given provider, model, and token usage.
 */
export function calculateCost(
  provider: 'openai' | 'anthropic',
  model: string,
  usage: TokenUsage
): CostEstimate {
  const providerPricing = PRICING[provider];
  const modelPricing =
    model in providerPricing
      ? (providerPricing as Record<string, { input: number; output: number }>)[model]
      : null;

  if (!modelPricing) {
    // Fallback to average pricing if model not found
    const avgPricing =
      provider === 'openai'
        ? { input: 10.0, output: 25.0 }
        : { input: 6.0, output: 30.0 };
    const inputCost = (usage.inputTokens / 1_000_000) * avgPricing.input;
    const outputCost = (usage.outputTokens / 1_000_000) * avgPricing.output;
    return { estimatedCostUsd: inputCost + outputCost };
  }

  const inputCost = (usage.inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * modelPricing.output;
  return { estimatedCostUsd: inputCost + outputCost };
}
