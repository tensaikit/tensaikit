import { WalletProvider } from "./walletProviders";
import {
  Action,
  ActionProvider,
  walletActionProvider,
} from "./actionProviders";

/**
 * Configuration options for initializing a TensaiKit instance.
 */
export type TensaiKitOptions = {
  walletProvider?: WalletProvider;
  actionProviders?: ActionProvider[];
};

/**
 * TensaiKit – Core SDK class for building autonomous DeFi AI agents on Katana.
 *
 * Provides integration with wallet and action providers to discover and perform
 * supported financial operations on-chain.
 */
export class TensaiKit {
  private walletProvider: WalletProvider;
  private actionProviders: ActionProvider[];

  /**
   * Internal constructor for TensaiKit. Use `TensaiKit.from()` to initialize.
   *
   * @param config - Configuration options for the TensaiKit
   * @param config.walletProvider - The wallet provider to use
   * @param config.actionProviders - The action providers to use
   * @param config.actions - The actions to use
   */
  private constructor(
    config: TensaiKitOptions & { walletProvider: WalletProvider }
  ) {
    this.walletProvider = config.walletProvider;
    this.actionProviders = config.actionProviders || [walletActionProvider()];
  }

  /**
   * Factory method to asynchronously initialize a TensaiKit instance.
   *
   * @param config - Optional configuration object including wallet and action providers.
   * @param config.walletProvider - The wallet provider to use
   * @param config.actionProviders - The action providers to use
   * @param config.actions - The actions to use
   *
   * @returns A promise that resolves to an initialized TensaiKit instance.
   *
   * @throws If `walletProvider` is not provided in the config.
   */
  public static async from(
    config: TensaiKitOptions = { actionProviders: [walletActionProvider()] }
  ): Promise<TensaiKit> {
    let walletProvider: WalletProvider | undefined = config.walletProvider;

    if (!walletProvider) {
      throw new Error("WalletProvider is required to initialize TensaiKit.");
    }

    return new TensaiKit({ ...config, walletProvider: walletProvider! });
  }

  /**
   * Retrieves all supported actions from available action providers.
   *
   * This filters out any action providers that do not support the current network
   * and logs a warning for each unsupported provider.
   *
   * @returns An array of supported actions available for execution.
   */
  public getActions(): Action[] {
    const actions: Action[] = [];

    const unsupportedProviders: string[] = [];

    for (const actionProvider of this.actionProviders) {
      if (actionProvider.supportsNetwork(this.walletProvider.getNetwork())) {
        actions.push(...actionProvider.getActions(this.walletProvider));
      } else {
        unsupportedProviders.push(actionProvider.name);
      }
    }

    if (unsupportedProviders.length > 0) {
      console.warn(
        `Warning: The following action providers are not supported on the current network and will be skipped: ${unsupportedProviders.join(
          ", "
        )}`
      );
      console.info("Current network:", this.walletProvider.getNetwork());
    }

    return actions;
  }
}
