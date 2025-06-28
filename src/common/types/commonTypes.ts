/**
 * Common types used across the application
 */

export type Address = `0x${string}`;
export type Hash = `0x${string}`;

export interface NetworkConfig {
  chainId: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
}

export interface GasConfig {
  gasLimitMultiplier?: number;
  feePerGasMultiplier?: number;
}

export interface TransactionConfig {
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}
