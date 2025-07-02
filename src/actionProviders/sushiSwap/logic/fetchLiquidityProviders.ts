import { handleError } from "../../../common/errors";
import { fetchFromApi } from "../../../common/utils";
import { SUSHI_LIQUIDITY_ENDPOINT } from "../utlis";

/**
 * Fetches the list of liquidity providers from the SushiSwap API for the given chain.
 *
 * @param chainId - The chain ID representing the target blockchain network.
 * @returns A promise resolving to the fetched liquidity provider data.
 * @throws Throws a formatted error if the API request fails.
 */
export const fetchLiquidityProviders = async (chainId: string) => {
  try {
    return await fetchFromApi<unknown>(
      `${SUSHI_LIQUIDITY_ENDPOINT}/${chainId}`
    );
  } catch (error: any) {
    throw handleError("Failed to fetch liquidity providers", error);
  }
};
