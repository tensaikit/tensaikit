import { createError, ErrorCode } from "../../common/errors";
import { fetchFromApi } from "../../common/utils/fetchFromApi";

// SushiSwap base API endpoints
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
 * Fetches metadata for a token (e.g., decimals, symbol, name) from SushiSwap's public API.
 *
 * @param chainId - Chain ID the token belongs to
 * @param tokenAddress - The ERC20 token contract address
 * @returns An object containing token metadata
 * @throws If the API call fails or returns an error
 */
export const fetchTokenMetadata = async (
  chainId: number,
  tokenAddress: string
) => {
  try {
    const metadata = await fetchFromApi<{
      chainId: number;
      address: `0x{string}`;
      decimals: number;
      symbol: string;
      name: string;
    }>(`${SUSHI_TOKEN_ENDPOINT}/${chainId}/${tokenAddress}`);

    return metadata;
  } catch (error: any) {
    throw createError(
      "Failed to fetch token information",
      ErrorCode.API_CALL_FAILED
    );
  }
};
