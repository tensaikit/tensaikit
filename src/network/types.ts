/**
 * Represents the blockchain network that the wallet is connected to.
 */
export interface Network {
  /**
   * The protocol family the network belongs to (e.g., 'evm').
   */
  protocolFamily: string;

  /**
   * The human-readable or internal network ID
   * (e.g., 'katana-network', 'polygon-mumbai').
   */
  networkId?: string;

  /**
   * The numeric chain ID of the network (EVM-specific).
   */
  chainId?: string;
}
