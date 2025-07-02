import { z } from "zod";

export const GetAllTokenPricesSchema = z.object({});
export const GetLiquidityProvidersSchema = z.object({});

export const GetTokenPriceSchema = z.object({
  tokenAddress: z
    .string()
    .describe("The address of the token to fetch the price for."),
});

export const GetTokenDetailsSchema = z.object({
  tokenAddress: z
    .string()
    .describe("The address of the token to retrieve metadata for."),
});

export const GetSwapQuoteSchema = z.object({
  tokenIn: z
    .string()
    .describe("Address of the token to be swapped from (input token)."),
  tokenOut: z
    .string()
    .describe("Address of the token to be swapped to (output token)."),
  amount: z
    .number()
    .describe(
      "Amount of the input token to swap. Example: 3.5 (will be converted to base units using token decimals)"
    ),
  maxSlippage: z
    .number()
    .describe("Maximum allowed slippage for the swap, e.g., 0.005 for 0.5%"),
});

export const GetExecuteSwapSchema = z.object({
  tokenIn: z
    .string()
    .min(42)
    .describe("Address of the token to be swapped from (input token)."),
  tokenOut: z
    .string()
    .min(42)
    .describe("Address of the token to be swapped to (output token)."),
  amount: z
    .number()
    .describe(
      "Amount of the input token to swap. Example: 3.5 (will be converted to base units using token decimals)"
    ),
  maxSlippage: z
    .number()
    .describe("Maximum allowed slippage for the swap, e.g., 0.005 for 0.5%"),
});

export const QueryGetSushiAllTokens = z.object({
  first: z
    .number()
    .int()
    .min(1, "Minimum value must be 1")
    .max(100, "Maximum value allowed is 100"),
  skip: z.number().int().min(0, "Skip must be 0 or greater"),
});
