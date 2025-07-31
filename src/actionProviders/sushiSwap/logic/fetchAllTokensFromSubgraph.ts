import { z } from "zod";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { makeSubgraphQueryCall } from "../../../common/utils";
import { EvmWalletProvider } from "../../../walletProviders";
import { QueryGetSushiAllTokens } from "../schemas";
import { querySushiSwapAllTokens } from "../subGraphQuery";
import { SUSHI_SWAP_GRAPH_URL } from "../utlis";

/**
 * Fetches a paginated list of tokens from the SushiSwap subgraph for a given chain.
 *
 * @param args - An object containing pagination parameters:
 *   - skip: Number of items to skip (for pagination).
 *   - first: Number of items to fetch.
 * @returns A promise resolving to an array of token objects, or a string message if no data is found.
 * @throws Throws a formatted error if the subgraph query fails.
 */
export const fetchAllTokensFromSubgraph = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof QueryGetSushiAllTokens>
) => {
  try {
    const network = walletProvider.getNetwork();
    const chainId = network.chainId;

    if (!chainId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const response = await makeSubgraphQueryCall(
      SUSHI_SWAP_GRAPH_URL,
      querySushiSwapAllTokens({
        skip: args.skip,
        first: args.first,
        chainId: Number(chainId),
      })
    );

    if (!response || !response.tokenList) {
      return `No token data found.`;
    }

    return response.tokenList;
  } catch (error: any) {
    throw handleError("Failed to fetch all tokens from subgraph", error);
  }
};
