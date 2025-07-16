import { createError, ErrorCode, handleError } from "../../../common/errors";
import { EvmWalletProvider } from "../../../walletProviders";
import { MORPHO_GRAPH_API_URL, MORPHO_SUPPORTED_SUB_GRAPH } from "../utils";
import { makeSubgraphQueryCall } from "../../../common/utils";
import { queryCurators } from "../query/morphoAPIQuery";

/**
 * Fetches all whitelisted curators from the Morpho subgraph for the connected network.
 *
 * This function queries the Morpho subgraph and retrieves metadata for each verified
 * or whitelisted curator (such as name, image, state, and verification status).
 *
 * @param walletProvider - Connected EVM wallet instance.
 *
 * @returns A Promise resolving to a list of curators with their metadata, or `null` if none found.
 *
 * @throws Will throw an error if:
 *  - The connected network or chainId is missing or invalid.
 *  - The network is not supported by the Morpho subgraph.
 *  - The subgraph query fails or returns an invalid response.
 */
export const fetchCurators = async (walletProvider: EvmWalletProvider) => {
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
      queryCurators({ chainId: Number(chainId) })
    );

    if (!response || !response.curators) {
      return null;
    }

    return response.curators;
  } catch (error: any) {
    throw handleError("Failed to fetch curators from Morpho subgraph", error);
  }
};
