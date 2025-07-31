import { z } from "zod";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { EvmWalletProvider } from "../../../walletProviders";
import { MarketStateByUniqueKeySchema } from "../schemas";
import { MORPHO_GRAPH_API_URL, MORPHO_SUPPORTED_SUB_GRAPH } from "../utils";
import { makeSubgraphQueryCall } from "../../../common/utils";
import { queryMarketStateByUniqueKey } from "../query/morphoAPIQuery";

/**
 * Fetches the on-chain state of a Morpho Blue market using its unique key.
 *
 * This function queries the Morpho subgraph to retrieve the current market state
 * (liquidity, borrow/supply stats, APYs, etc.) associated with the provided `uniqueKey`.
 *
 * @param walletProvider - Connected EVM wallet instance.
 * @param args - Object containing a valid `uniqueKey` (bytes32) to identify the market.
 *
 * @returns A Promise resolving to the state of the specified market,
 *          or `null` if the market is not found or has no recorded state.
 *
 * @throws Will throw an error if:
 *  - Network or chainId is missing or invalid.
 *  - The network is not supported by Morpho subgraph.
 *  - A subgraph call fails or returns an invalid result.
 */
export const fetchMarketStateByUniqueKey = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof MarketStateByUniqueKeySchema>
) => {
  try {
    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    const networkId = network.networkId;
    if (!chainId || !networkId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    if (!MORPHO_SUPPORTED_SUB_GRAPH.includes(network.networkId!)) {
      throw createError("Network not supported!", ErrorCode.INVALID_NETWORK);
    }

    const response = await makeSubgraphQueryCall(
      MORPHO_GRAPH_API_URL,
      queryMarketStateByUniqueKey({
        chainId: Number(chainId),
        uniqueKey: args.uniqueKey,
      })
    );

    if (!response || !response.marketByUniqueKey) {
      return null;
    }

    return response.marketByUniqueKey;
  } catch (error: any) {
    throw handleError("Failed to fetch market state by uniqueKey", error);
  }
};
