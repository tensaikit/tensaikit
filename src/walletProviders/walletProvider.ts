import { Network } from "../network";

/**
 * Abstract base class for all wallet providers.
 *
 * Defines the common interface required to interact with any wallet implementation,
 * such as Privy, Viem, or custom providers.
 *
 * @abstract
 */
export abstract class WalletProvider {
  /**
   * Initializes the wallet provider.
   */
  constructor() {
    // Wait for the next tick to ensure child class is initialized
  }

  /**
   * Tracks the initialization of the wallet provider.
   */

  /**
   * Returns the wallet address associated with this provider.
   *
   * @returns The address of the wallet provider.
   */
  abstract getAddress(): string;

  /**
   * Returns the network configuration associated with this wallet.
   *
   * @returns The network of the wallet provider.
   */
  abstract getNetwork(): Network;

  /**
   * Signs a message using the wallet.
   *
   * @param message - A string or byte array message to be signed.
   * @returns A hex-encoded signature.
   */
  abstract signMessage(message: string | Uint8Array): Promise<`0x${string}`>;

  /**
   * Get the name of the wallet provider.
   *
   * @returns The name of the wallet provider.
   */
  abstract getName(): string;

  /**
   * Fetches the current balance of the wallet's native asset (e.g., ETH).
   *
   * @returns The balance in wei as a bigint.
   */
  abstract getBalance(): Promise<bigint>;

  /**
   * Transfers the native asset of the network to the specified address.
   *
   * @param to - The recipient EVM-compatible address.
   * @param value - The amount to send in whole units (e.g., "0.1" ETH).
   * @returns The transaction hash of the transfer.
   */
  abstract nativeTransfer(to: string, value: string): Promise<string>;
}
