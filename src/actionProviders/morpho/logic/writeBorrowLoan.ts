import { z } from "zod";
import { EvmWalletProvider } from "../../../walletProviders";
import { abi as ERC20_ABI } from "../../erc20/constants";
import { BorrowSchema } from "../schemas";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import Decimal from "decimal.js";
import { fetchMarketConfigFromContract } from "./fetchMarketConfigFromContract";
import { encodeFunctionData, parseUnits } from "viem";
import { MORPHO_BLUE_ABI } from "../abi/morphoBlueABI";

/**
 * Borrows a specified amount of loanToken from a Morpho Blue market using the connected wallet.
 *
 * This function:
 * 1. Validates the input amount is greater than zero.
 * 2. Fetches the market configuration for the provided `marketId`.
 * 3. Reads the `decimals` of the loan token to convert user input to atomic units.
 * 4. Prepares and encodes the `borrow` transaction for the Morpho Blue contract.
 * 5. Sends the transaction and waits for confirmation.
 *
 * The borrow action transfers the specified loanToken amount from the Morpho market to the caller's wallet.
 *
 * @param walletProvider - Instance of {@link EvmWalletProvider} connected to the user's wallet.
 * @param args - Object validated by {@link BorrowSchema}, containing:
 *   @property {string} assets - Amount of loanToken to borrow (as a human-readable string).
 *   @property {string} marketId - The bytes32 hex string identifier for the target market.
 *
 * @returns A Promise resolving to an object containing:
 *   @property {string} loanToken - The token being borrowed.
 *   @property {string} txHash - The transaction hash of the borrow operation.
 *   @property {object} receipt - The transaction receipt returned by the network.
 *
 * @throws Will throw if:
 *   - The input amount is invalid or zero.
 *   - Market configuration is missing or invalid.
 *   - Decimals lookup or transaction preparation fails.
 *   - Transaction fails to send or confirm.
 */
export const writeBorrowLoan = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof BorrowSchema>
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
      functionName: "borrow",
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
    throw handleError("Error borrowing from Morpho Vault", error);
  }
};
