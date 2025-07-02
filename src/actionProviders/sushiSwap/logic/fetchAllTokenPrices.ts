import { handleError } from "../../../common/errors";
import { SushiSwapModule } from "../utlis";

/**
 * Fetches USD prices for all tokens available on the specified EVM chain via the SushiSwap module.
 *
 * @param chainId - The chain ID (as a string) representing the target blockchain network.
 * @returns A promise resolving to a map of token addresses to their current USD prices.
 * @throws Throws a formatted error if price fetching fails.
 */
export const fetchAllTokenPrices = async (chainId: string) => {
  try {
    const sushiSwapModule = await SushiSwapModule();
    const typedChainId = chainId as keyof typeof sushiSwapModule.prices;
    return await sushiSwapModule.prices(typedChainId);
  } catch (error: any) {
    throw handleError("Failed to fetch all token prices", error);
  }
};
