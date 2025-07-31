import { z } from "zod";
import { EvmWalletProvider } from "../../../walletProviders";
import { abi as ERC20_ABI } from "../../erc20/constants";
import { RepaySchema } from "../schemas";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { fetchMarketConfigFromContract } from "./fetchMarketConfigFromContract";
import Decimal from "decimal.js";
import { encodeFunctionData, parseUnits } from "viem";
import { allowance, approve } from "../../../utils";
import { MORPHO_BLUE_ABI } from "../abi/morphoBlueABI";

/**
 * Repays a specified amount of loanToken to a Morpho Blue market on behalf of the connected wallet.
 *
 * This function:
 * 1. Validates that the input amount is a positive number.
 * 2. Fetches the market configuration from the Morpho Blue contract using the given `marketId`.
 * 3. Determines the loan token's decimals and parses the human-readable amount into atomic units.
 * 4. Checks and ensures sufficient allowance; triggers approval if required.
 * 5. Encodes the `repay` call and sends the transaction to the Morpho Blue contract.
 * 6. Waits for the transaction to be confirmed and returns the result.
 *
 * @param walletProvider - Instance of {@link EvmWalletProvider} connected to the user's wallet.
 * @param args - Object matching {@link RepaySchema}, containing:
 *   @property {string} assets - Amount of loanToken to repay (as a string in user-readable units).
 *   @property {string} marketId - Unique bytes32 identifier for the market.
 *
 * @returns A Promise resolving to an object containing:
 *   @property {string} loanToken - Address of the loan token being repaid.
 *   @property {string} txHash - Transaction hash of the repay operation.
 *   @property {object} receipt - Transaction receipt after successful confirmation.
 *
 * @throws Will throw an error if:
 *   - The input amount is invalid or zero.
 *   - Market configuration is missing or malformed.
 *   - ERC20 allowance is insufficient and approval fails.
 *   - Transaction fails to send or confirm on-chain.
 */
export const writeRepayLoan = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof RepaySchema>
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

    const currentAllowance = await allowance(
      walletProvider,
      loanToken,
      marketResponse.morphoBlueContractAddress
    );

    if (currentAllowance < atomicAssets) {
      const approvalResult = await approve(
        walletProvider,
        loanToken,
        marketResponse.morphoBlueContractAddress,
        atomicAssets
      );
      if (approvalResult.startsWith("Error")) {
        throw createError(
          `Error approving Morpho Vault as spender: ${approvalResult}`,
          ErrorCode.CONTRACT_ERROR
        );
      } else {
        console.log(approvalResult);
      }
    }

    const data = encodeFunctionData({
      abi: MORPHO_BLUE_ABI,
      functionName: "repay",
      args: [
        marketResponse,
        atomicAssets,
        BigInt(0),
        walletProvider.getAddress(),
        "0x",
      ],
    });

    const txHash = await walletProvider.sendTransaction({
      to: marketResponse.morphoBlueContractAddress,
      data,
    });

    const receipt = await walletProvider.waitForTransactionReceipt(txHash);

    return { loanToken, txHash, receipt };
  } catch (error: any) {
    throw handleError("Error repaying to Morpho Vault", error);
  }
};
