import { z } from "zod";
import { EvmWalletProvider } from "../../../walletProviders";
import { GetMarketInfoSchema } from "../schemas";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { getMorphoBlueContractAddress } from "../utils";
import { Hex } from "viem";
import { MORPHO_BLUE_ABI } from "../abi/morphoBlueABI";

/**
 * Fetches detailed market information for a given Morpho Blue market ID.
 *
 * This function interacts with the Morpho Blue smart contract on the current network,
 * using the provided EVM wallet provider to read the market parameters associated with
 * the specified `marketId`. These parameters include the loan token address, collateral
 * token address, oracle, interest rate model (IRM), and loan-to-value ratio (LLTV).
 *
 * @param walletProvider - An instance of {@link EvmWalletProvider} connected to the user's wallet.
 * @param args - An object validated by {@link GetMarketInfoSchema}, containing:
 *   @property {string} marketId - The unique bytes32 market identifier (hex string).
 *
 * @returns A Promise resolving to an object with the following properties:
 *   @property {string} marketId - The original market ID used in the request.
 *   @property {string} loanToken - The address of the loan token for the market.
 *   @property {string} collateralToken - The address of the collateral token.
 *   @property {string} oracle - The address of the oracle associated with the market.
 *   @property {string} irm - The address of the Interest Rate Model contract.
 *   @property {bigint} lltv - The loan-to-value ratio in basis points (1e4 = 100%).
 *
 * @throws Will throw an error if:
 *   - The network or chainId is invalid or unavailable.
 *   - The market ID does not exist or returns no response from the contract.
 *   - Any unexpected error occurs during contract read.
 */
export const fetchMarketConfigFromContract = async (
  walletProvider: EvmWalletProvider,
  args: z.infer<typeof GetMarketInfoSchema>
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
      functionName: "idToMarketParams",
      args: [args.marketId],
    });

    if (!marketResponse) {
      throw createError(
        "Invalid market id or missing market information",
        ErrorCode.INVALID_INPUT
      );
    }
    const loanToken = marketResponse[0];
    const collateralToken = marketResponse[1];
    const oracle = marketResponse[2];
    const irm = marketResponse[3];
    const lltv = marketResponse[4];

    return {
      marketId: args.marketId,
      morphoBlueContractAddress: morphoBlueContractAddress,
      loanToken: loanToken,
      collateralToken: collateralToken,
      oracle: oracle,
      irm: irm,
      lltv: lltv,
    };
  } catch (error: any) {
    throw handleError("Error fetching Morpho Vault Information", error);
  }
};
