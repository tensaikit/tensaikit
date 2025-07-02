import z from "zod";
import { ActionProvider } from "../../actionProvider";
import { CreateAction } from "../../actionDecorator";
import { EvmWalletProvider } from "../../../walletProviders";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { Network } from "../../../network";
import { GetLiquidityProvidersSchema } from "../schemas";
import { fetchLiquidityProviders } from "../logic";
import { wrapAndStringify } from "../../../common/utils";

/**
 * This class provides SushiSwap liquidity-related actions.
 * Currently supports fetching available liquidity providers on a specific EVM chain.
 */
export class SushiSwapLiquidityActions extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("sushi_swap.liquidity", []);
  }

  /**
   * Retrieves all available SushiSwap liquidity providers on the chain associated with the wallet provider.
   *
   * @params _ - None (uses walletProvider context to get chainId)
   * @returns {Promise<string>} A stringified JSON representation of liquidity provider information.
   * @throws {CustomError} - If the API call fails.
   */
  @CreateAction({
    name: "get_liquidity_providers",
    description: `
      Retrieves all available liquidity providers on a specific chain.
  `,
    schema: GetLiquidityProvidersSchema,
  })
  async getLiquidityProviders(
    walletProvider: EvmWalletProvider,
    _: z.infer<typeof GetLiquidityProvidersSchema>
  ): Promise<string> {
    try {
      const chainId = walletProvider.getNetwork().chainId;
      if (!chainId) {
        throw createError(
          "Invalid or missing chain ID",
          ErrorCode.INVALID_NETWORK
        );
      }
      const response = await fetchLiquidityProviders(chainId);
      return wrapAndStringify(
        "sushi_swap.liquidity.get_liquidity_providers",
        response
      );
    } catch (error) {
      throw handleError("Failed to retrieve liquidity providers", error);
    }
  }

  supportsNetwork = (network: Network) => network.protocolFamily === "evm";
}
