import z from "zod";
import { ActionProvider } from "../../actionProvider";
import { CreateAction } from "../../actionDecorator";
import { EvmWalletProvider } from "../../../walletProviders";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { Network } from "../../../network";
import { GetAllTokenPricesSchema, GetTokenPriceSchema } from "../schemas";
import { fetchAllTokenPrices, fetchTokenPrice } from "../logic";
import { wrapAndStringify } from "../../../common/utils";

/**
 * SushiSwapPriceActions provides methods to fetch token prices from SushiSwap.
 *
 * This action group offers price-related utilities using SushiSwap's pricing module,
 * allowing access to both individual token prices and bulk price data for all tokens
 * on a connected EVM-compatible network.
 *
 * Responsibilities:
 * - Fetch USD prices for all tokens supported by SushiSwap on a given chain
 * - Fetch USD price for a specific token using its contract address
 *
 */
export class SushiSwapPriceActions extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("sushi_swap.price", []);
  }

  /**
   * Fetches USD prices for all tokens on the connected EVM chain.
   *
   * @param walletProvider - Instance of EVM-compatible WalletProvider
   * @param _ - Unused (empty) arguments validated by schema
   * @returns A JSON string of all token prices
   * @throws If chainId is missing or API call fails
   */
  @CreateAction({
    name: "get_all_token_prices",
    description: `
      Returns USD prices for all tokens on a specific chain.
  `,
    schema: GetAllTokenPricesSchema,
  })
  async getAllTokenPrices(
    walletProvider: EvmWalletProvider,
    _: z.infer<typeof GetAllTokenPricesSchema>
  ): Promise<string> {
    try {
      const chainId = walletProvider.getNetwork().chainId;
      if (!chainId) {
        throw createError(
          "Invalid or missing chain ID",
          ErrorCode.INVALID_NETWORK
        );
      }
      const response = await fetchAllTokenPrices(chainId);
      return wrapAndStringify(
        "sushi_swap.price.get_all_token_prices",
        response
      );
    } catch (error) {
      throw handleError("Failed to fetch all token prices", error);
    }
  }

  /**
   * Fetches the USD price of a specific token from SushiSwap.
   *
   * @param walletProvider - Instance of EVM-compatible WalletProvider
   * @param args - Includes `tokenAddress` of the token to fetch
   * @returns A JSON string containing the token price
   * @throws If chainId is missing or API call fails
   */
  @CreateAction({
    name: "get_token_price",
    description: `
    Returns the USD price of a specific token on a given chain.

    Inputs:
    - tokenAddress: Token contract address.

    Notes:
    - Ensure the token address is valid and supported by SushiSwap.
  `,
    schema: GetTokenPriceSchema,
  })
  async getTokenPrice(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetTokenPriceSchema>
  ): Promise<string> {
    try {
      const { tokenAddress } = args;
      const chainId = walletProvider.getNetwork().chainId;
      if (!chainId) {
        throw createError(
          "Invalid or missing chain ID",
          ErrorCode.INVALID_NETWORK
        );
      }
      const response = await fetchTokenPrice(chainId, tokenAddress);
      return wrapAndStringify(
        "sushi_swap.price.get_token_price",
        response.toString()
      );
    } catch (error) {
      throw handleError("Failed to fetch token price", error);
    }
  }

  supportsNetwork = (network: Network) => network.protocolFamily === "evm";
}
