import { z } from "zod";
import { EvmWalletProvider, ViemWalletProvider } from "../../walletProviders";
import { ActionProvider } from "../actionProvider";
import { Network } from "../../network";
import { CreateAction } from "../actionDecorator";
import { GetExecuteSwapSchema } from "./schemas";
import { DEFAULT_MAX_SLIPPAGE } from "./utlis";
import { prepareAndSendSwapTransaction } from "./logic";
import { wrapAndStringify } from "../../common/utils";
import { handleError } from "../../common/errors";

/**
 * SushiSwapExecuteOnlyActionProvider is a minimal action provider for SushiSwap,
 * exposing only swap execution functionality using Viem-compatible wallet providers.
 *
 * Registered under action provider key: `sushi_swap.execute_only`
 */
export class SushiSwapExecuteOnlyActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Constructs the minimal SushiSwap provider and registers only the execute actions.
   */
  constructor() {
    super("sushi_swap.execute_only", []);
  }

  /**
   * Executes a token swap on SushiSwap using Viem, with automatic approval if necessary.
   *
   * @param walletProvider - An instance of Viem-compatible WalletProvider
   * @param args - Object containing tokenIn, tokenOut, amount, and optional maxSlippage
   * @returns A formatted string containing the transaction hash and simulation result
   * @throws If approval, quote generation, simulation, or transaction sending fails
   */
  @CreateAction({
    name: "execute_swap",
    description: `
    Executes a token swap on SushiSwap using the Viem client.

    Inputs:
    - tokenIn: Address of the input token. Example: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE (native MATIC)
    - tokenOut: Address of the output token. Example: 0xc2132D05D31c914a87C6611C10748AEb04B58e8F (USDT)
    - amount: Amount of the input token to swap. Example: 3.5 (will be converted to base units using token decimals)
    - maxSlippage: Optional maximum allowed slippage for the swap (e.g., 0.005 for 0.5%). Default: 0.005 (0.5%)

    Note: This action will broadcast a transaction on-chain and may consume gas.
  `,
    schema: GetExecuteSwapSchema,
  })
  async executeSwap(
    walletProvider: ViemWalletProvider,
    args: z.infer<typeof GetExecuteSwapSchema>
  ): Promise<any> {
    try {
      const {
        tokenIn,
        tokenOut,
        amount,
        maxSlippage = DEFAULT_MAX_SLIPPAGE,
      } = args;

      const response = await prepareAndSendSwapTransaction(walletProvider, {
        tokenIn,
        tokenOut,
        amount,
        maxSlippage,
      });
      return wrapAndStringify("sushi_swap.execute_only.execute_swap", response);
    } catch (error) {
      throw handleError("Failed to execute swap", error);
    }
  }

  /**
   * Checks if the SushiSwap action provider supports the given network.
   *
   * @param network - The network to validate.
   * @returns `true` if the network uses the EVM protocol family, else `false`.
   */
  supportsNetwork = (network: Network) => network.protocolFamily === "evm";
}

/**
 * Creates a new instance of SushiSwapExecuteOnlyActionProvider.
 * @returns A minimal action provider focused solely on swap execution.
 */
export const sushiSwapExecuteOnlyActionProvider = () =>
  new SushiSwapExecuteOnlyActionProvider();
