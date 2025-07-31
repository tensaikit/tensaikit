// List of supported networks for Morpho Subgraph functionality
export const MORPHO_SUPPORTED_SUB_GRAPH = ["katana-mainnet"];

// List of supported networks for general Morpho Protocol functionality
export const MORPHO_SUPPORTED_PROTOCOL = ["katana-mainnet", "katana-testnet"];

/**
 * Returns the on-chain contract address for the Morpho Blue protocol
 * for a given supported network's chain ID.
 *
 * @param chainId - The numeric Chain ID of the network
 * @returns The contract address for Morpho Blue on that network
 * @throws If the chain ID is not supported
 */
export const getMorphoBlueContractAddress = (chainId: number) => {
  switch (chainId) {
    case 129399: // Katana Testnet
      return "0xC263190b99ceb7e2b7409059D24CB573e3bB9021";
    case 747474: // Katana Mainnet
      return "0xD50F2DffFd62f94Ee4AEd9ca05C61d0753268aBc";
    default:
      throw new Error(`${chainId} not supported for Morpho Blue.`);
  }
};

export const MORPHO_GRAPH_API_URL = "https://api.morpho.org/graphql";
