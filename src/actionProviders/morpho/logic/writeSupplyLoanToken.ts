import { z } from "zod";
import { EvmWalletProvider } from "../../../walletProviders";
import { abi as ERC20_ABI } from "../../erc20/constants";
import { SupplySchema } from "../schemas";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { fetchMarketConfigFromContract } from "./fetchMarketConfigFromContract";
import Decimal from "decimal.js";
import { encodeFunctionData, parseUnits } from "viem";
import { allowance, approve } from "../../../utils";
import { MORPHO_BLUE_ABI } from "../abi/morphoBlueABI";

/**
 * Supplies a specified amount of loanToken into a Morpho Blue market on behalf of the connected wallet.
 *
 * This function:
 * 1. Validates input and ensures asset amount is greater than zero.
 * 2. Fetches market configuration using the provided marketId.
 * 3. Reads the loanToken's decimals and parses the asset amount into atomic units.
 * 4. Checks allowance and, if necessary, approves the Morpho Blue contract to spend tokens.
 * 5. Prepares the calldata for the `supply` function on the Morpho Blue contract.
 * 6. Sends the supply transaction and returns the transaction hash and receipt.
 *
 * @param walletProvider - Instance of {@link EvmWalletProvider} connected to the user's wallet.
 * @param args - Validated input matching {@link SupplySchema}, containing:
 *   @property {string} assets - Amount of loanToken to supply (as a string in human-readable units).
 *   @property {string} marketId - Unique market identifier (bytes32 hex string).
 *
 * @returns A Promise resolving to an object containing:
 *   @property {string} loanToken - The address of the loan token used.
 *   @property {string} txHash - The hash of the supply transaction.
 *   @property {object} receipt - The transaction receipt from the network.
 *
 * @throws Will throw if:
 *   - The input `assets` value is zero or invalid.
 *   - Market configuration cannot be fetched or is invalid.
 *   - Approve call fails, or allowance check/setting fails.
 *   - The transaction fails to send or confirm.
 */
export const writeSupplyLoanToken = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof SupplySchema>
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
      functionName: "supply",
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
    throw handleError("Error supplying loan token to Morpho Vault", error);
  }
};
