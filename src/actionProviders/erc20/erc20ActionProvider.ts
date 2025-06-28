import { z } from "zod";
import { ActionProvider } from "../actionProvider";
import { Network } from "../../network";
import { CreateAction } from "../actionDecorator";
import { GetBalanceSchema, TransferSchema } from "./schemas";
import { abi } from "./constants";
import { encodeFunctionData, formatUnits, Hex } from "viem";
import { EvmWalletProvider } from "../../walletProviders";

/**
 * ERC20ActionProvider provides actions to interact with ERC20 tokens such as
 * checking token balances and initiating token transfers.
 */
export class ERC20ActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Constructs a new ERC20ActionProvider instance with no predefined actions.
   */
  constructor() {
    super("erc20", []);
  }

  /**
   * Fetches the ERC20 token balance for the connected wallet address.
   *
   * @param walletProvider - The EVM-compatible wallet provider
   * @param args - Contains the contract address of the ERC20 token
   * @returns A formatted message showing the balance in human-readable units
   */
  @CreateAction({
    name: "get_balance",
    description: `This tool will get the balance of an ERC20 asset in the wallet. It takes the contract address as input.`,
    schema: GetBalanceSchema,
  })
  async getBalance(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetBalanceSchema>
  ): Promise<string> {
    try {
      const balance = await walletProvider.readContract({
        address: args.contractAddress as Hex,
        abi,
        functionName: "balanceOf",
        args: [walletProvider.getAddress() as Hex],
      });

      const decimals = await walletProvider.readContract({
        address: args.contractAddress as Hex,
        abi,
        functionName: "decimals",
        args: [],
      });

      return `Balance of ${args.contractAddress} is ${formatUnits(
        balance,
        decimals
      )}`;
    } catch (error) {
      return `Error getting balance: ${error}`;
    }
  }

  /**
   * Transfers ERC20 tokens from the connected wallet to another onchain address.
   *
   * @param walletProvider - The EVM-compatible wallet provider
   * @param args - Contains token contract address, destination, and amount
   * @returns A success message including transaction hash, or an error message
   */
  @CreateAction({
    name: "transfer",
    description: `
    This tool will transfer an ERC20 token from the wallet to another onchain address.

    It takes the following inputs:
    - amount: The amount to transfer
    - contractAddress: The contract address of the token to transfer
    - destination: Where to send the funds (can be an onchain address, ENS 'example.eth'')

    Important notes:
    - Ensure sufficient balance of the input asset before transferring
    - When sending native assets (e.g. 'eth' on katana-network), ensure there is sufficient balance for the transfer itself AND the gas cost of this transfer
    `,
    schema: TransferSchema,
  })
  async transfer(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof TransferSchema>
  ): Promise<string> {
    try {
      const hash = await walletProvider.sendTransaction({
        to: args.contractAddress as Hex,
        data: encodeFunctionData({
          abi,
          functionName: "transfer",
          args: [args.destination as Hex, BigInt(args.amount)],
        }),
      });

      await walletProvider.waitForTransactionReceipt(hash);

      return `Transferred ${args.amount} of ${args.contractAddress} to ${args.destination}.\nTransaction hash for the transfer: ${hash}`;
    } catch (error) {
      return `Error transferring the asset: ${error}`;
    }
  }

  supportsNetwork = (network: Network) => network.protocolFamily === "evm";
}

export const erc20ActionProvider = () => new ERC20ActionProvider();
