import { EvmWalletProvider } from "../../walletProviders";
import { ActionProvider } from "../actionProvider";
import { Network } from "../../network";
import {
  SushiSwapPriceActions,
  SushiSwapLiquidityActions,
  SushiSwapSwapActions,
} from "./actions";

/**
 * SushiSwapActionProvider is an action provider for interacting with the SushiSwap DEX.
 * It bundles multiple action groups: price, swap, and liquidity management.
 */
export class SushiSwapActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Constructs the SushiSwapActionProvider and registers its action groups.
   */
  constructor() {
    super("sushiSwap", [
      new SushiSwapPriceActions(),
      new SushiSwapLiquidityActions(),
      new SushiSwapSwapActions(),
    ]);
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
 * Creates a new instance of SushiSwapActionProvider.
 * @returns A new instance of SushiSwapActionProvider
 */
export const sushiSwapActionProvider = () => new SushiSwapActionProvider();
