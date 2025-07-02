import { handleError } from "../../../common/errors";
import { SushiSwapModule } from "../utlis";

/**
 * Fetches the USD price of a specific token on the specified EVM chain using the SushiSwap module.
 *
 * @param chainId - The chain ID representing the target blockchain network.
 * @param tokenAddress - The address of the token to fetch the price for.
 * @returns A promise resolving to the token's USD price.
 * @throws Throws a formatted error if the price retrieval fails.
 */
export const fetchTokenPrice = async (
  chainId: string,
  tokenAddress: string
) => {
  try {
    const sushiSwapModule = await SushiSwapModule();
    const typedChainId = chainId as keyof typeof sushiSwapModule.price;
    return await sushiSwapModule.price(
      typedChainId,
      tokenAddress as `0x${string}`
    );
  } catch (error: any) {
    throw handleError("Failed to fetch token price", error);
  }
};
