import { EvmWalletProvider } from "../../walletProviders";
import { ActionProvider } from "../actionProvider";
import { Network } from "../../network";
import {
  SushiSwapPriceActions,
  SushiSwapLiquidityActions,
  SushiSwapQuoteActions,
  SushiSwapTokenActions,
} from "./actions";

/**
 * Configuration options for initializing the SushiSwapActionProvider.
 *
 * @property subGraphApiKey - API key required to query SushiSwap's subgraph. This is mandatory.
 */
export interface SushiSwapActionProviderConfig {
  // Subgraph API key (required for queries)
  subGraphApiKey?: string;
}

/**
 * SushiSwapActionProvider is a modular integration layer for interacting with SushiSwap on EVM-compatible chains.
 *
 * This provider bundles multiple functional action groups:
 * - Token pricing (USD prices and metadata)
 * - Token discovery via subgraph
 * - Swap quote generation
 *
 * Responsibilities:
 * - Register individual SushiSwap action modules into a unified provider
 * - Enforce required configuration (e.g., subgraph API key)
 * - Determine whether the current network is supported (EVM only)
 *
 *
 * Usage:
 * ```ts
 * const provider = new SushiSwapActionProvider({ subGraphApiKey: "<API_KEY>" });
 * ```
 */
export class SushiSwapActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Constructs the SushiSwapActionProvider and registers its action groups.
   */
  constructor(config: SushiSwapActionProviderConfig = {}) {
    config.subGraphApiKey ||= process.env.SUBGRAPH_API_KEY || "";
    if (!config.subGraphApiKey) {
      throw new Error("SUBGRAPH_API_KEY is not configured.");
    }

    super("sushi_swap", [
      new SushiSwapPriceActions(),
      new SushiSwapLiquidityActions(),
      new SushiSwapTokenActions(config.subGraphApiKey),
      new SushiSwapQuoteActions(),
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
