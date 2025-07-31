import { z } from "zod";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { EvmWalletProvider } from "../../../walletProviders";
import { WhitelistedVaultsQuerySchema } from "../schemas";
import { MORPHO_GRAPH_API_URL, MORPHO_SUPPORTED_SUB_GRAPH } from "../utils";
import { makeSubgraphQueryCall } from "../../../common/utils";
import { queryWhitelistedVaults } from "../query/morphoAPIQuery";

/**
 * Fetches all whitelisted vaults for the connected network using the Morpho subgraph.
 *
 * This function queries the Morpho Blue subgraph for vaults that are flagged as `whitelisted`,
 * ordered by total assets in USD (descending), using pagination inputs `skip` and `first`.
 *
 * @param walletProvider - The EVM wallet provider instance to determine the connected chain/network.
 * @param args - An object validated by `WhitelistedVaultsQuerySchema` containing:
 *  - `skip`: Number of items to skip for pagination.
 *  - `first`: Number of items to fetch (limit).
 *  - `chainId`: Chain ID to query the appropriate subgraph.
 *
 * @returns A list of whitelisted vault objects if available, or `null` if no vaults are found.
 *
 * @throws Will throw an error if:
 *  - The network or chainId is missing or invalid.
 *  - The subgraph for the given network is not supported.
 *  - The subgraph query fails or returns unexpected results.
 */
export const fetchWhitelistedVaults = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof WhitelistedVaultsQuerySchema>
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
      queryWhitelistedVaults({
        chainId: Number(chainId),
        first: args.first,
        skip: args.skip,
      })
    );

    if (!response || !response.vaults) {
      return null;
    }

    return response.vaults;
  } catch (error: any) {
    throw handleError("Failed to fetch whitelisted vaults", error);
  }
};
