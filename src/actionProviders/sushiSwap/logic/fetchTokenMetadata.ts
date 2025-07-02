import { createError, ErrorCode } from "../../../common/errors";
import { fetchFromApi } from "../../../common/utils";
import { SUSHI_TOKEN_ENDPOINT } from "../utlis";

/**
 * Fetches metadata for a token (e.g., decimals, symbol, name) from SushiSwap's public API.
 *
 * @param chainId - Chain ID the token belongs to
 * @param tokenAddress - The ERC20 token contract address
 * @returns An object containing token metadata
 * @throws If the API call fails or returns an error
 */
export const fetchTokenMetadata = async (
  chainId: string,
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
