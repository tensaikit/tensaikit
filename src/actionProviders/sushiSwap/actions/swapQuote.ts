import z from "zod";
import { ActionProvider } from "../../actionProvider";
import { CreateAction } from "../../actionDecorator";
import { EvmWalletProvider } from "../../../walletProviders";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { Network } from "../../../network";
import { GetSwapQuoteSchema } from "../schemas";
import { DEFAULT_MAX_SLIPPAGE } from "../utlis";
import { fetchSwapQuote } from "../logic";
import { wrapAndStringify } from "../../../common/utils";

/**
 * SushiSwapQuoteActions provides functionality to generate swap quotes from SushiSwap.
 *
 * This action group handles fetching and formatting quote data for token swaps on EVM-compatible chains.
 * It interacts with the SushiSwap public quote API and prepares data required for downstream swap execution.
 *
 * Responsibilities:
 * - Convert human-readable token amounts into base units using token metadata
 * - Handle optional slippage settings
 * - Fetch swap quote including expected output, route, and calldata
 *
 */
export class SushiSwapQuoteActions extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("sushi_swap.quote", []);
  }

  /**
   * Fetches a swap quote for a given token pair and amount from SushiSwap’s public API.
   *
   * @param walletProvider - An instance of EVM-compatible WalletProvider
   * @param args - Object containing tokenIn, tokenOut, amount, and optional maxSlippage
   * @returns A formatted string representing the swap quote
   * @throws If token metadata is invalid or the API request fails
   */
  @CreateAction({
    name: "get_swap_quote",
    description: `
  Generates a swap quote for a given token pair and amount on a specific chain.

  Inputs:
  - tokenIn: Address of the input token.
  - tokenOut: Address of the output token.
  - amount: Amount of the input token to swap. Example: 3.5 (will be converted to base units using token decimals)
  - maxSlippage: Optional parameters for route planning. Maximum allowed slippage for the swap is 1, e.g., 0.005 for 0.5%. Default: 0.005 for 0.5%


  Notes:
  - Ensure all addresses are checksummed and valid.
  `,
    schema: GetSwapQuoteSchema,
  })
  async getSwapQuote(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetSwapQuoteSchema>
  ): Promise<any> {
    try {
      const {
        tokenIn,
        tokenOut,
        amount,
        maxSlippage = DEFAULT_MAX_SLIPPAGE,
      } = args;
      const chainId = walletProvider.getNetwork().chainId;
      if (!chainId) {
        throw createError(
          "Invalid or missing chain ID",
          ErrorCode.INVALID_NETWORK
        );
      }

      const response = await fetchSwapQuote(chainId, {
        tokenIn,
        tokenOut,
        amount,
        maxSlippage,
      });
      return wrapAndStringify("sushi_swap.quote.get_token_price", response);
    } catch (error) {
      throw handleError("Failed to generate swap quote", error);
    }
  }

  supportsNetwork = (network: Network) => network.protocolFamily === "evm";
}
