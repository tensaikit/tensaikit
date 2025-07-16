import { z } from "zod";
import { EvmWalletProvider } from "../../../walletProviders";
import { abi as ERC20_ABI } from "../../erc20/constants";
import { SupplyCollateralSchema } from "../schemas";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import Decimal from "decimal.js";
import { fetchMarketConfigFromContract } from "./fetchMarketConfigFromContract";
import { MORPHO_BLUE_ABI } from "../abi/morphoBlueABI";
import { encodeFunctionData, parseUnits } from "viem";
import { allowance, approve } from "../../../utils";

/**
 * Supplies a specified amount of collateralToken into a Morpho Blue market using the connected wallet.
 *
 * This function:
 * 1. Validates that the input asset amount is greater than zero.
 * 2. Fetches the market configuration using the provided marketId.
 * 3. Reads the collateralToken's decimals and parses the input amount to atomic units.
 * 4. Checks and ensures the token allowance; calls approve if necessary.
 * 5. Prepares and encodes the `supplyCollateral` function call to Morpho Blue.
 * 6. Sends the transaction and waits for it to be mined.
 *
 * This is typically used to deposit collateral before borrowing from a Morpho Blue market.
 *
 * @param walletProvider - Instance of {@link EvmWalletProvider} connected to the user's wallet.
 * @param args - Object validated by {@link SupplyCollateralSchema}, including:
 *   @property {string} assets - The amount of collateralToken to supply (human-readable string).
 *   @property {string} marketId - The bytes32 hex identifier for the target Morpho Blue market.
 *
 * @returns A Promise resolving to an object with:
 *   @property {string} collateralToken - The ERC20 address of the collateral token.
 *   @property {string} txHash - The hash of the submitted supplyCollateral transaction.
 *   @property {object} receipt - The transaction receipt after confirmation.
 *
 * @throws Will throw if:
 *   - The assets value is invalid or non-positive.
 *   - The marketId is invalid or configuration cannot be fetched.
 *   - The token approval process fails.
 *   - The transaction fails to send or confirm on-chain.
 */
export const writeSupplyCollateralToken = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof SupplyCollateralSchema>
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

    const currentAllowance = await allowance(
      walletProvider,
      collateralToken,
      marketResponse.morphoBlueContractAddress
    );

    if (currentAllowance < atomicAssets) {
      const approvalResult = await approve(
        walletProvider,
        collateralToken,
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
      functionName: "supplyCollateral",
      args: [marketResponse, atomicAssets, walletProvider.getAddress(), "0x"],
    });

    const txHash = await walletProvider.sendTransaction({
      to: marketResponse.morphoBlueContractAddress,
      data,
    });

    const receipt = await walletProvider.waitForTransactionReceipt(txHash);

    return {
      collateralToken,
      txHash,
      receipt,
    };
  } catch (error: any) {
    throw handleError("Error supplying collateral to Morpho Vault", error);
  }
};
