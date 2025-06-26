import z from "zod";
import { ActionProvider } from "../../actionProvider";
import { CreateAction } from "../../actionDecorator";
import { EvmWalletProvider } from "../../../walletProviders";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { objectToString } from "../../../common/utils/objectToString";
import { Network } from "../../../network";
import {
  GetAllTokenPricesSchema,
  GetTokenDetailsSchema,
  GetTokenPriceSchema,
} from "../schemas";
import { fetchTokenMetadata, SushiSwapModule } from "../utlis";

/**
 * Provides price and metadata-related actions for tokens on SushiSwap.
 * Supports fetching all token prices, a single token price, and token metadata.
 */
export class SushiSwapPriceActions extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("sushiSwap.price", []);
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
      const sushiSwapModule = await SushiSwapModule();
      const typedChainId = chainId as keyof typeof sushiSwapModule.prices;
      const response = await sushiSwapModule.prices(typedChainId);
      return objectToString(response);
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
      const sushiSwapModule = await SushiSwapModule();
      const typedChainId = chainId as keyof typeof sushiSwapModule.price;
      const response = await sushiSwapModule.price(
        typedChainId,
        tokenAddress as `0x${string}`
      );
      return objectToString(response);
    } catch (error) {
      throw handleError("Failed to fetch token price", error);
    }
  }

  /**
   * Fetches metadata for a token (e.g., decimals, symbol, name) from SushiSwap's public API.
   *
   * @param walletProvider - Instance of EVM-compatible WalletProvider
   * @param args - Includes `tokenAddress` of the token to fetch metadata for
   * @returns A JSON string containing token metadata
   * @throws If the API call fails or the token is unsupported
   */
  @CreateAction({
    name: "get_token_details",
    description: `
    Retrieves metadata for a specific token on a chain.

    Inputs:
    - chainId: Chain ID of the network.
    - tokenAddress: Contract address of the token.

    Notes:
    - Ensure the token address is valid and supported by SushiSwap.
  `,
    schema: GetTokenDetailsSchema,
  })
  async getTokenDetails(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetTokenDetailsSchema>
  ): Promise<string> {
    try {
      const { tokenAddress } = args;
      const chainId = walletProvider.getNetwork().chainId;
      const response = await fetchTokenMetadata(Number(chainId), tokenAddress);
      return objectToString(response);
    } catch (error) {
      throw handleError("Failed to retrieve token details", error);
    }
  }

  supportsNetwork = (network: Network) => network.protocolFamily === "evm";
}
