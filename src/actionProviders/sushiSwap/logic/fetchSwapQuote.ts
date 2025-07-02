import Decimal from "decimal.js";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { fetchFromApi } from "../../../common/utils";
import { SUSHI_QUOTE_ENDPOINT } from "../utlis";
import { fetchTokenMetadata } from "./fetchTokenMetadata";

/**
 * Fetches a swap quote from the SushiSwap API for a given token pair and amount.
 *
 * This function converts the input amount to base units using the token's decimals,
 * builds the required query parameters, and then fetches a quote with slippage consideration.
 *
 * @param chainId - The chain ID representing the target blockchain network.
 * @param args - An object containing swap parameters:
 *   - tokenIn: The address of the input token.
 *   - tokenOut: The address of the output token.
 *   - maxSlippage: The maximum allowed slippage percentage (e.g., 0.5 for 0.5%).
 *   - amount: The input amount in human-readable units (e.g., 1.5 ETH).
 *
 * @returns A promise resolving to the swap quote data.
 * @throws Throws a formatted error if token metadata fetch or quote API call fails.
 */
export const fetchSwapQuote = async (
  chainId: string,
  args: {
    tokenIn: string;
    tokenOut: string;
    maxSlippage: number;
    amount: number;
  }
) => {
  try {
    const tokenMetadata = await fetchTokenMetadata(chainId, args.tokenIn);

    if (!tokenMetadata?.decimals) {
      throw createError(
        "Failed to fetch token decimals",
        ErrorCode.TOKEN_METADATA_ERROR
      );
    }
    const amountInBaseUnits = new Decimal(args.amount)
      .mul(new Decimal(10).pow(tokenMetadata.decimals))
      .toFixed(0);

    const params = new URLSearchParams({
      tokenIn: args.tokenIn,
      tokenOut: args.tokenOut,
      amount: amountInBaseUnits,
      maxSlippage: args.maxSlippage.toString(),
    });

    return await fetchFromApi<unknown>(
      `${SUSHI_QUOTE_ENDPOINT}/${chainId}?${params}`
    );
  } catch (error: any) {
    throw handleError("Failed to fetch swap quote", error);
  }
};
