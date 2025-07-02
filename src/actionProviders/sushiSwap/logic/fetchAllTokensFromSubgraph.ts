import { handleError } from "../../../common/errors";
import { makeSubgraphQueryCall } from "../../../common/utils";
import { querySushiSwapAllTokens } from "../subGraphQuery";
import { subGraphUrlByChainId } from "../utlis";

/**
 * Fetches a paginated list of tokens from the SushiSwap subgraph for a given chain.
 *
 * @param chainId - The chain ID representing the target blockchain network.
 * @param args - An object containing pagination parameters:
 *   - skip: Number of items to skip (for pagination).
 *   - first: Number of items to fetch.
 * @param subGraphApiKey - The API key used for authenticating with the subgraph service.
 * @returns A promise resolving to an array of token objects, or a string message if no data is found.
 * @throws Throws a formatted error if the subgraph query fails.
 */
export const fetchAllTokensFromSubgraph = async (
  chainId: string,
  args: { skip: number; first: number },
  subGraphApiKey: string
) => {
  try {
    const subGraphUrl = subGraphUrlByChainId(Number(chainId));
    const response = await makeSubgraphQueryCall(
      subGraphUrl,
      querySushiSwapAllTokens({ skip: args.skip, first: args.first }),
      subGraphApiKey
    );

    if (!response || !response.tokens) {
      return `No token data found.`;
    }

    return response.tokens;
  } catch (error: any) {
    throw handleError("Failed to fetch all tokens from subgraph", error);
  }
};
