import { z } from "zod";
import { EvmWalletProvider } from "../../../walletProviders";
import { GetMarketPositionInfoSchema } from "../schemas";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { getMorphoBlueContractAddress } from "../utils";
import { Hex } from "viem";
import { MORPHO_BLUE_ABI } from "../abi/morphoBlueABI";

/**
 * Fetches the position information for the connected wallet in a specific Morpho Blue market.
 *
 * This function uses the provided EVM wallet provider to query the Morpho Blue contract
 * for the current user's position in the specified market. It retrieves supply shares,
 * borrow shares, and collateral balances associated with the wallet address.
 *
 * @param walletProvider - An instance of {@link EvmWalletProvider} connected to the user's wallet.
 * @param args - An object validated by {@link GetMarketPositionInfoSchema}, containing:
 *   @property {string} marketId - The unique bytes32 market identifier (hex string).
 *
 * @returns A Promise resolving to an object with the following properties:
 *   @property {string} marketId - The original market ID used in the request.
 *   @property {bigint} supplyShares - The number of supply shares the wallet holds in the market.
 *   @property {bigint} borrowShares - The number of borrow shares the wallet has taken from the market.
 *   @property {bigint} collateral - The amount of collateral the wallet has deposited in the market.
 *
 * @throws Will throw an error if:
 *   - The wallet provider's network or chainId is invalid or not available.
 *   - The market ID is invalid or the contract returns no data.
 *   - Any unexpected error occurs while interacting with the contract.
 */
export const fetchPositionInfoFromContract = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof GetMarketPositionInfoSchema>
) => {
  try {
    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    if (!chainId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const morphoBlueContractAddress = getMorphoBlueContractAddress(
      Number(chainId)
    ) as Hex;

    const marketResponse = await walletProvider.readContract({
      address: morphoBlueContractAddress,
      abi: MORPHO_BLUE_ABI,
      functionName: "position",
      args: [args.marketId, walletProvider.getAddress()],
    });

    if (!marketResponse) {
      throw createError(
        "Invalid market id or missing market information",
        ErrorCode.INVALID_INPUT
      );
    }
    const supplyShares = marketResponse[0];
    const borrowShares = marketResponse[1];
    const collateral = marketResponse[2];

    return {
      marketId: args.marketId,
      supplyShares: supplyShares,
      borrowShares: borrowShares,
      collateral: collateral,
    };
  } catch (error: any) {
    throw handleError("Error fetching Morpho Vault Positions", error);
  }
};
