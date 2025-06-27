import { z } from "zod";

/**
 * Schema for fetching token prices by symbol from Alchemy.
 *
 * Expects an object containing an array of token symbols.
 *
 * Example input:
 * {
 *   symbols: ["ETH", "BTC", "POL"]
 * }
 */
export const AlchemyTokenPricesBySymbolSchema = z
  .object({
    symbols: z
      .array(z.string())
      .min(
        1,
        "At least one token symbol is required. Example: ETH, BTC, SOL, etc."
      )
      .max(25, "A maximum of 25 token symbols can be provided."),
  })
  .describe("Input schema for fetching token prices by symbol from Alchemy");
