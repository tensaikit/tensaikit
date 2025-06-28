import { encodeFunctionData } from "viem";
import { EvmWalletProvider } from "./walletProviders";
import { createError, ErrorCode } from "./common/errors";

const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Approves a spender to spend tokens on behalf of the owner.
 *
 * Encodes and sends an ERC-20 `approve` transaction using the provided wallet,
 * allowing the specified spender to spend a given amount of tokens.
 *
 * @param wallet - The EVM wallet provider used to sign and send the transaction.
 * @param tokenAddress - The ERC-20 token contract address.
 * @param spenderAddress - The address being approved to spend tokens.
 * @param amount - The amount of tokens to approve (in atomic units, e.g., wei).
 * @returns A promise that resolves to a success or error message string.
 */
export const approve = async (
  wallet: EvmWalletProvider,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint
): Promise<string> => {
  try {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, amount],
    });

    const txHash = await wallet.sendTransaction({
      to: tokenAddress as `0x${string}`,
      data,
    });

    await wallet.waitForTransactionReceipt(txHash);

    return `Approval successful: ${spenderAddress} is now allowed to spend up to ${amount.toString()} tokens.`;
  } catch (error) {
    return `Error approving tokens for ${spenderAddress}: ${
      (error as Error).message || error
    }`;
  }
};

/**
 * Scales a gas estimate by a given multiplier.
 *
 * This function converts the gas estimate to a number, applies the multiplier,
 * rounds the result to the nearest integer, and returns it as a bigint.
 *
 * @param gas - The original gas estimate as a bigint.
 * @param multiplier - The factor by which to scale the estimate.
 * @returns The adjusted gas estimate as a bigint.
 */
export const applyGasMultiplier = (gas: bigint, multiplier: number): bigint => {
  return BigInt(Math.round(Number(gas) * multiplier));
};

/**
 * Fetches the current token allowance for a spender set by the connected wallet.
 *
 * Calls the ERC-20 `allowance` function to determine how many tokens the
 * `spenderAddress` is allowed to spend on behalf of the wallet's address.
 *
 * @param wallet - The EVM wallet provider used to get the owner's address and read from the contract
 * @param tokenAddress - The address of the ERC-20 token contract
 * @param spenderAddress - The address of the spender whose allowance is being queried
 * @returns A promise that resolves to the allowance amount as a bigint
 * @throws CONTRACT_ERROR if the read call fails
 */
export const allowance = async (
  wallet: EvmWalletProvider,
  tokenAddress: string,
  spenderAddress: string
): Promise<bigint> => {
  try {
    const ownerAddress = wallet.getAddress() as `0x${string}`;

    const allowanceAmount = await wallet.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [ownerAddress, spenderAddress as `0x${string}`],
    });

    console.log(
      `[Token Allowance] Spender: ${spenderAddress} | Owner: ${ownerAddress} | Allowance: ${allowanceAmount.toString()}`
    );
    return allowanceAmount;
  } catch (error) {
    throw createError(
      `Failed to fetch allowance from contract: ${error}`,
      ErrorCode.CONTRACT_ERROR
    );
  }
};

/**
 * Checks if the provided token address represents a native token (e.g., ETH, MATIC).
 *
 * Considers two common placeholders used to represent native tokens:
 * - `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` (commonly used in DeFi protocols)
 * - `0x0000000000000000000000000000000000000000` (null address)
 *
 * @param tokenAddress - The token address to check
 * @returns `true` if the address is a known native token placeholder, otherwise `false`
 */
export const isNativeToken = (tokenAddress: string): boolean => {
  const normalized = tokenAddress.toLowerCase();
  return (
    normalized === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ||
    normalized === "0x0000000000000000000000000000000000000000"
  );
};
