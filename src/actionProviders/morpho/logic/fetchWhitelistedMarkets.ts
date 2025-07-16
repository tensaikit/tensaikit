import { z } from "zod";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { ActiveMarketsQuerySchema } from "../schemas";
import { EvmWalletProvider } from "../../../walletProviders";
import { MORPHO_GRAPH_API_URL, MORPHO_SUPPORTED_SUB_GRAPH } from "../utils";
import { makeSubgraphQueryCall } from "../../../common/utils";
import { queryWhitelistedMarkets } from "../query/morphoAPIQuery";

/**
 * Fetches whitelisted Morpho Blue markets from the subgraph for the connected network.
 *
 * This function queries the Morpho Blue subgraph for all active and whitelisted markets,
 * ordered by borrow APY (descending), using the provided pagination parameters.
 *
 * @param walletProvider - The connected EVM wallet provider instance.
 * @param args - An object conforming to `ActiveMarketsQuerySchema`:
 *   - `skip`: Number of items to skip for pagination.
 *   - `first`: Number of items to fetch (limit).
 *
 * @returns A list of whitelisted Morpho Blue market objects if available, or `null` if none found.
 *
 * @throws Will throw an error if:
 *  - The network or chainId is not detected or invalid.
 *  - The connected network is not supported by the Morpho subgraph.
 *  - The subgraph query fails or returns unexpected data.
 */
export const fetchWhitelistedMarkets = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof ActiveMarketsQuerySchema>
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
      queryWhitelistedMarkets({
        chainId: Number(chainId),
        first: args.first,
        skip: args.skip,
      })
    );

    if (!response || !response.markets) {
      return null;
    }

    return response.markets;
  } catch (error: any) {
    throw handleError("Failed to fetch whitelisted markets", error);
  }
};
