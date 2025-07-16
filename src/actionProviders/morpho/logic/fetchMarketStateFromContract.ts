import { z } from "zod";
import { EvmWalletProvider } from "../../../walletProviders";
import { GetMarketStatesSchema } from "../schemas";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { getMorphoBlueContractAddress } from "../utils";
import { Hex } from "viem";
import { MORPHO_BLUE_ABI } from "../abi/morphoBlueABI";

/**
 * Fetches the current state variables of a Morpho Blue market using the given market ID.
 *
 * This function:
 * 1. Detects the current network from the wallet provider.
 * 2. Resolves the correct Morpho Blue contract address using the chain ID.
 * 3. Calls the `market` function of the Morpho Blue contract to retrieve market-level statistics.
 * 4. Extracts and returns state variables such as total supply/borrow assets and shares, last update timestamp, and fee.
 *
 * This is useful for computing utilization rates, health factors, and APYs in frontend or analytics dashboards.
 *
 * @param walletProvider - An instance of {@link EvmWalletProvider} used to interact with the connected EVM network.
 * @param args - An object matching {@link GetMarketStatesSchema}, including:
 *   @property {string} marketId - The bytes32 hex string identifying the target Morpho Blue market.
 *
 * @returns A Promise resolving to an object with:
 *   @property {string} marketId - The ID of the queried market.
 *   @property {bigint} totalSupplyAssets - Total amount of supplied assets in the market.
 *   @property {bigint} totalSupplyShares - Total shares issued for suppliers.
 *   @property {bigint} totalBorrowAssets - Total borrowed assets in the market.
 *   @property {bigint} totalBorrowShares - Total shares representing borrowed positions.
 *   @property {bigint} lastUpdate - Timestamp of the last interest accrual or update.
 *   @property {bigint} fee - Current fee charged by the protocol (likely in basis points or similar unit).
 *
 * @throws Will throw if:
 *   - Network information is missing or invalid.
 *   - The market contract call fails or returns empty.
 */
export const fetchMarketStateFromContract = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof GetMarketStatesSchema>
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
      functionName: "market",
      args: [args.marketId],
    });

    if (!marketResponse) {
      throw createError(
        "Invalid market id or missing market information",
        ErrorCode.INVALID_INPUT
      );
    }
    const totalSupplyAssets = marketResponse[0];
    const totalSupplyShares = marketResponse[1];
    const totalBorrowAssets = marketResponse[2];
    const totalBorrowShares = marketResponse[3];
    const lastUpdate = marketResponse[4];
    const fee = marketResponse[5];

    return {
      marketId: args.marketId,
      totalSupplyAssets: totalSupplyAssets,
      totalSupplyShares: totalSupplyShares,
      totalBorrowAssets: totalBorrowAssets,
      totalBorrowShares: totalBorrowShares,
      lastUpdate: lastUpdate,
      fee: fee,
    };
  } catch (error: any) {
    throw handleError("Error fetching states for Morpho Vault", error);
  }
};
