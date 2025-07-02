// List of supported networks for Morpho Subgraph functionality
export const MORPHO_SUPPORTED_SUB_GRAPH = ["polygon-mainnet"];

// List of supported networks for general Morpho Protocol functionality
export const MORPHO_SUPPORTED_PROTOCOL = [
  "polygon-mainnet",
  "katana-mainnet",
  "katana-testnet",
];

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
    case 137: // Polygon POS
      return "0x1bF0c2541F820E775182832f06c0B7Fc27A25f67";
    default:
      throw new Error(`${chainId} not supported for Morpho Blue.`);
  }
};

/**
 * Returns the subgraph endpoint URL for querying Morpho Blue protocol data
 * from The Graph on a supported chain.
 *
 * @param chainId - The numeric Chain ID of the network
 * @returns The Graph subgraph URL
 * @throws If the chain ID is not supported for subgraph access
 */
export const subGraphUrlByChainId = (chainId: number) => {
  switch (chainId) {
    case 137: // Polygon POS
      return "https://gateway.thegraph.com/api/subgraphs/id/EhFokmwryNs7qbvostceRqVdjc3petuD13mmdUiMBw8Y";

    default:
      throw new Error(`${chainId} not supported for Morpho Blue.`);
  }
};
