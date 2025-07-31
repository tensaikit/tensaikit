import { z } from "zod";
import { EvmWalletProvider } from "../../../walletProviders";
import { abi as ERC20_ABI } from "../../erc20/constants";
import { WithdrawSchema } from "../schemas";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import Decimal from "decimal.js";
import { fetchMarketConfigFromContract } from "./fetchMarketConfigFromContract";
import { encodeFunctionData, parseUnits } from "viem";
import { MORPHO_BLUE_ABI } from "../abi/morphoBlueABI";

/**
 * Withdraws a specified amount of previously supplied loanToken from a Morpho Blue market.
 *
 * This function:
 * 1. Validates that the user-specified amount (`assets`) is a positive number.
 * 2. Fetches the Morpho Blue market configuration using the provided `marketId`.
 * 3. Determines the token decimals and converts the asset amount to atomic units.
 * 4. Encodes the `withdraw` function call for the Morpho Blue contract.
 * 5. Sends the transaction to withdraw the specified amount and waits for confirmation.
 *
 * Used when a user wants to retrieve supplied loanToken funds from a lending position.
 *
 * @param walletProvider - Instance of {@link EvmWalletProvider} connected to the user's wallet.
 * @param args - Object validated by {@link WithdrawSchema}, including:
 *   @property {string} assets - Amount of loanToken to withdraw (human-readable format).
 *   @property {string} marketId - The bytes32 market identifier to withdraw from.
 *
 * @returns A Promise resolving to an object containing:
 *   @property {string} loanToken - ERC20 address of the token being withdrawn.
 *   @property {string} txHash - Transaction hash of the withdraw operation.
 *   @property {object} receipt - The receipt of the completed transaction.
 *
 * @throws Will throw if:
 *   - The input `assets` amount is zero or invalid.
 *   - The market configuration is missing or malformed.
 *   - The transaction fails to send or confirm.
 */
export const writeWithdrawLoanToken = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof WithdrawSchema>
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

    const loanToken = marketResponse.loanToken;

    const decimals = await walletProvider.readContract({
      address: loanToken,
      abi: ERC20_ABI,
      functionName: "decimals",
      args: [],
    });
    const atomicAssets = parseUnits(args.assets, decimals);

    const data = encodeFunctionData({
      abi: MORPHO_BLUE_ABI,
      functionName: "withdraw",
      args: [
        marketResponse,
        atomicAssets,
        BigInt(0),
        walletProvider.getAddress(),
        walletProvider.getAddress(),
      ],
    });

    const txHash = await walletProvider.sendTransaction({
      to: marketResponse.morphoBlueContractAddress,
      data,
    });

    const receipt = await walletProvider.waitForTransactionReceipt(txHash);

    return { loanToken, txHash, receipt };
  } catch (error: any) {
    throw handleError("Error withdrawing from Morpho Vault", error);
  }
};
