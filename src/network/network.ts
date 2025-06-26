import { Chain } from "viem/chains";
import * as chains from "viem/chains";
import { katana } from "./katanaNetwork";

/**
 * Maps EVM chain IDs to tensai-kit network IDs.
 */
export const CHAIN_ID_TO_NETWORK_ID: Record<number, string> = {
  129399: "katana-network",
};

/**
 * Maps tensai-kit network IDs to EVM chain IDs
 */
export const NETWORK_ID_TO_CHAIN_ID: Record<string, string> = Object.entries(
  CHAIN_ID_TO_NETWORK_ID
).reduce((acc, [chainId, networkId]) => {
  acc[networkId] = String(chainId);
  return acc;
}, {} as Record<string, string>);

/**
 * Maps tensai-kit network IDs to Viem chain objects
 */
export const NETWORK_ID_TO_VIEM_CHAIN: Record<string, Chain> = {
  "katana-network": katana(""),
};

/**
 * Retrieve a `Chain` object using its chain ID.
 *
 * @param id - The EVM chain ID (as string or number).
 * @returns The matching `Chain` object.
 * @throws If the chain is not found.
 */
export const getChain = (id: string | number): Chain => {
  const chainId = typeof id === "string" ? parseInt(id) : id;
  const chainList = Object.values(chains);
  const match = chainList.find((chain) => chain.id === chainId);

  if (!match) {
    throw new Error(`Chain with ID ${chainId} not found in viem chains`);
  }

  return match;
};
