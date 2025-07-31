import { z } from "zod";
import { EvmWalletProvider } from "../../../walletProviders";
import { abi as ERC20_ABI } from "../../erc20/constants";
import { WithdrawCollateralSchema } from "../schemas";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import Decimal from "decimal.js";
import { fetchMarketConfigFromContract } from "./fetchMarketConfigFromContract";
import { encodeFunctionData, parseUnits } from "viem";
import { MORPHO_BLUE_ABI } from "../abi/morphoBlueABI";

/**
 * Withdraws a specified amount of collateralToken from a Morpho Blue market for the connected wallet.
 *
 * This function:
 * 1. Validates that the requested `assets` amount is greater than zero.
 * 2. Fetches market configuration using the provided `marketId`.
 * 3. Determines the decimals of the collateral token and converts the user-readable amount to atomic units.
 * 4. Encodes the `withdrawCollateral` function call to the Morpho Blue contract.
 * 5. Sends the transaction to withdraw collateral and waits for its confirmation.
 *
 * This is typically used to reclaim previously deposited collateral, if conditions allow (e.g. health factor is safe).
 *
 * @param walletProvider - Instance of {@link EvmWalletProvider} connected to the user's wallet.
 * @param args - Object matching {@link WithdrawCollateralSchema}, including:
 *   @property {string} assets - The amount of collateralToken to withdraw (human-readable string).
 *   @property {string} marketId - The bytes32 hex identifier of the market to withdraw from.
 *
 * @returns A Promise resolving to an object containing:
 *   @property {string} collateralToken - The ERC20 token address of the withdrawn collateral.
 *   @property {string} txHash - The transaction hash of the withdrawal.
 *   @property {object} receipt - The transaction receipt after confirmation.
 *
 * @throws Will throw if:
 *   - The input amount is invalid or zero.
 *   - The market configuration cannot be fetched.
 *   - The transaction fails to send or confirm.
 */
export const writeWithdrawCollateralToken = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof WithdrawCollateralSchema>
) => {
  try {
    const assets = new Decimal(args.assets);

    if (assets.lessThanOrEqualTo(0)) {
      throw createError(
        "Error: Assets amount must be greater than 0",
        ErrorCode.INVALID_INPUT
      );
    }

    const marketResponse = await fetchMarketConfigFromContract(walletProvider, {
      marketId: args.marketId,
    });

    if (!marketResponse) {
      throw createError(
        "Invalid market id or missing market information",
        ErrorCode.INVALID_INPUT
      );
    }

    const collateralToken = marketResponse.collateralToken;

    const decimals = await walletProvider.readContract({
      address: collateralToken,
      abi: ERC20_ABI,
      functionName: "decimals",
      args: [],
    });
    const atomicAssets = parseUnits(args.assets, decimals);

    const data = encodeFunctionData({
      abi: MORPHO_BLUE_ABI,
      functionName: "withdrawCollateral",
      args: [
        marketResponse,
        atomicAssets,
        walletProvider.getAddress(),
        walletProvider.getAddress(),
      ],
    });

    const txHash = await walletProvider.sendTransaction({
      to: marketResponse.morphoBlueContractAddress,
      data,
    });

    const receipt = await walletProvider.waitForTransactionReceipt(txHash);

    return { collateralToken, txHash, receipt };
  } catch (error: any) {
    throw handleError(
      "Failed to withdraw collateral token from Morpho Vault",
      error
    );
  }
};
