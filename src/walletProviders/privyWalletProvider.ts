import {
  PrivyEvmWalletProvider,
  PrivyEvmWalletConfig,
} from "./privyEvmWalletProvider";
import {
  PrivyEvmDelegatedEmbeddedWalletProvider,
  PrivyEvmDelegatedEmbeddedWalletConfig,
} from "./privyEvmDelegatedEmbeddedWalletProvider";

type PrivyWalletConfig = (
  | PrivyEvmWalletConfig
  | PrivyEvmDelegatedEmbeddedWalletConfig
) & {
  walletType?: "server" | "embedded";
};

export type PrivyWalletProviderVariant<T> = T extends { walletType: "embedded" }
  ? PrivyEvmDelegatedEmbeddedWalletProvider
  : PrivyEvmWalletProvider;

/**
 * Factory class for creating chain-specific Privy wallet providers
 */
export class PrivyWalletProvider {
  /**
   * Creates and configures a new wallet provider instance based on the chain type and wallet type.
   *
   * @param config - The configuration options for the Privy wallet
   * @returns A configured WalletProvider instance for the specified chain and wallet type
   *
   * @example
   * ```typescript
   * // For EVM server wallets (default)
   * const evmWallet = await PrivyWalletProvider.configureWithWallet({
   *   appId: "your-app-id",
   *   appSecret: "your-app-secret"
   * });
   *
   * // For Ethereum embedded wallets
   * const embeddedWallet = await PrivyWalletProvider.configureWithWallet({
   *   appId: "your-app-id",
   *   appSecret: "your-app-secret",
   *   walletId: "delegated-wallet-id",
   *   walletType: "embedded"
   * });
   * ```
   */
  static async configureWithWallet<T extends PrivyWalletConfig>(
    config: T
  ): Promise<PrivyWalletProviderVariant<T>> {
    const walletType = config.walletType || "server";

    switch (walletType) {
      case "server":
        return (await PrivyEvmWalletProvider.configureWithWallet(
          config as PrivyEvmWalletConfig
        )) as PrivyWalletProviderVariant<T>;
      case "embedded":
        return (await PrivyEvmDelegatedEmbeddedWalletProvider.configureWithWallet(
          config as PrivyEvmDelegatedEmbeddedWalletConfig
        )) as PrivyWalletProviderVariant<T>;
      default:
        throw new Error("Invalid wallet type");
    }
  }
}
