// SushiSwap API endpoints
export const SUSHI_ENDPOINT = "https://api.sushi.com";
export const SUSHI_QUOTE_ENDPOINT = SUSHI_ENDPOINT + "/quote/v7";
export const SUSHI_TOKEN_ENDPOINT = SUSHI_ENDPOINT + "/token/v1";
export const SUSHI_LIQUIDITY_ENDPOINT =
  SUSHI_ENDPOINT + "/liquidity-providers/v7";

// Default maximum slippage (0.5%)
export const DEFAULT_MAX_SLIPPAGE = 0.005;

// Default fallback spender address (SushiSwap router or smart order router)
const DEFAULT_SPENDER = "0xAC4c6e212A361c968F1725b4d055b47E63F80b75";

/**
 * Dynamically imports Sushi SDK and exposes primary swap utilities.
 * Lazy-loaded to optimize bundle size.
 */
export const SushiSwapModule = async () => {
  const sushiModule = await import("sushi");
  return {
    price: sushiModule.getPrice,
    prices: sushiModule.getPrices,
    getSwap: sushiModule.getSwap,
  };
};

const SUSHI_SPENDER_MAP: Record<number, `0x${string}`> = {
  324: "0x35E98C2b3894D71D3D4D7edb8b30E4f36E2f9179", // zkSync
  810181: "0x35E98C2b3894D71D3D4D7edb8b30E4f36E2f9179", // zkLink Nova
};

/**
 * Gets the appropriate SushiSwap router/spender address for a given chain ID.
 *
 * @param chainId - The EVM chain ID
 * @returns A spender address to use for token approvals
 */
export const getSpender = (chainId: number): `0x${string}` => {
  return SUSHI_SPENDER_MAP[chainId] || DEFAULT_SPENDER;
};

/**
 * Returns the subgraph endpoint URL for querying Sushi protocol data
 * from The Graph on a supported chain.
 *
 * @param chainId - The numeric Chain ID of the network
 * @returns The Graph subgraph URL
 * @throws If the chain ID is not supported for subgraph access
 */
export const subGraphUrlByChainId = (chainId: number) => {
  switch (chainId) {
    case 129399: // Katana
      return "https://gateway-arbitrum.network.thegraph.com/api/subgraphs/id/2YG7eSFHx1Wm9SHKdcrM8HR23JQpVe8fNNdmDHMXyVYR";

    default:
      throw new Error(`${chainId} not supported for Morpho Blue.`);
  }
};
