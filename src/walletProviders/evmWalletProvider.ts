/* eslint-disable @typescript-eslint/no-explicit-any */

import { toAccount } from "viem/accounts";
import { WalletProvider } from "./walletProvider";
import {
  TransactionRequest,
  ReadContractParameters,
  ReadContractReturnType,
  ContractFunctionName,
  Abi,
  ContractFunctionArgs,
  Account,
  Address,
} from "viem";

/**
 * Abstract base class for all EVM-compatible wallet providers.
 *
 * Provides methods for signing messages, transactions, typed data, and interacting
 * with smart contracts on EVM chains.
 *
 * @abstract
 */
export abstract class EvmWalletProvider extends WalletProvider {
  /**
   * Converts this wallet provider into a Viem-compatible `Account` signer object.
   *
   * @returns The signer.
   */
  toSigner(): Account {
    return toAccount({
      address: this.getAddress() as Address,
      signMessage: async ({ message }) => {
        return this.signMessage(message as string | Uint8Array);
      },
      signTransaction: async (transaction) => {
        return this.signTransaction(transaction as TransactionRequest);
      },
      signTypedData: async (typedData) => {
        return this.signTypedData(typedData);
      },
    });
  }

  /**
   * Signs an arbitrary message using the wallet's private key.
   *
   * @param message - The message to sign (string or bytes).
   * @returns The signature as a hex string.
   */
  abstract signMessage(message: string | Uint8Array): Promise<`0x${string}`>;

  /**
   * Sign a typed data.
   *
   * @param typedData - The typed data to sign.
   * @returns The signed typed data.
   */
  abstract signTypedData(typedData: any): Promise<`0x${string}`>;

  /**
   * Signs a transaction without broadcasting it.
   *
   * @param transaction - The transaction object to sign.
   * @returns The signed transaction as a hex string.
   */
  abstract signTransaction(
    transaction: TransactionRequest
  ): Promise<`0x${string}`>;

  /**
   * Sends a signed transaction to the network.
   *
   * @param transaction - The transaction object to send.
   * @returns The resulting transaction hash.
   */
  abstract sendTransaction(
    transaction: TransactionRequest
  ): Promise<`0x${string}`>;

  /**
   * Waits for a transaction to be confirmed on-chain and returns its receipt.
   *
   * @param txHash - The transaction hash.
   * @returns The transaction receipt object.
   */
  abstract waitForTransactionReceipt(txHash: `0x${string}`): Promise<any>;

  /**
   * Executes a read-only call to a smart contract function.
   *
   * @param params - The parameters including contract address, ABI, function name, and arguments.
   * @returns The response from the contract.
   */
  abstract readContract<
    const abi extends Abi | readonly unknown[],
    functionName extends ContractFunctionName<abi, "pure" | "view">,
    const args extends ContractFunctionArgs<abi, "pure" | "view", functionName>
  >(
    params: ReadContractParameters<abi, functionName, args>
  ): Promise<ReadContractReturnType<abi, functionName, args>>;
}
