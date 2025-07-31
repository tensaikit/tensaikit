import { createError, ErrorCode, handleError } from "../../../common/errors";
import { makeSubgraphQueryCall } from "../../../common/utils";
import { EvmWalletProvider } from "../../../walletProviders";
import { queryUserDataByAddress } from "../query/morphoAPIQuery";
import { MORPHO_GRAPH_API_URL, MORPHO_SUPPORTED_SUB_GRAPH } from "../utils";

/**
 * Fetches Morpho Blue user data (positions, vaults, and transactions) by wallet address.
 *
 * This function queries the Morpho subgraph for a user's detailed activity and positions
 * using the connected wallet's address on the supported chain/network.
 *
 * It retrieves:
 * - Market positions (supply, borrow, collateral, PnL)
 * - Vault positions (assets, shares, USD value)
 * - Transaction history
 *
 * @param walletProvider - The connected EVM wallet provider instance.
 *
 * @returns A user object from the subgraph including positions and transactions,
 *          or `null` if the user has no data or address is not found.
 *
 * @throws Will throw an error if:
 *  - Network/chainId is missing or invalid.
 *  - The network is not supported by the Morpho subgraph.
 *  - The subgraph query fails or returns invalid data.
 */
export const fetchUserDataByAddress = async (
  walletProvider: EvmWalletProvider
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
      queryUserDataByAddress({
        chainId: Number(chainId),
        address: walletProvider.getAddress(),
      })
    );

    if (!response || !response.userByAddress) {
      return null;
    }

    return response.userByAddress;
  } catch (error: any) {
    throw handleError("Failed to fetch user data from Morpho subgraph", error);
  }
};
