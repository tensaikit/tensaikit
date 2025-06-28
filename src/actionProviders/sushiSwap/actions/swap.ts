import z from "zod";
import { ActionProvider } from "../../actionProvider";
import { CreateAction } from "../../actionDecorator";
import {
  EvmWalletProvider,
  ViemWalletProvider,
} from "../../../walletProviders";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { fetchFromApi } from "../../../common/utils/fetchFromApi";
import { objectToString } from "../../../common/utils/objectToString";
import { Network, NETWORK_ID_TO_VIEM_CHAIN } from "../../../network";
import { GetExecuteSwapSchema, GetSwapQuoteSchema } from "../schemas";
import {
  DEFAULT_MAX_SLIPPAGE,
  fetchTokenMetadata,
  getSpender,
  SUSHI_QUOTE_ENDPOINT,
  SushiSwapModule,
} from "../utlis";
import { createPublicClient, http, PublicClient } from "viem";
import Decimal from "decimal.js";
import { approve, allowance, isNativeToken } from "../../../utils";

/**
 * SushiSwapSwapActions provides functionality to fetch swap quotes
 * and execute swaps via SushiSwap's APIs and Viem client.
 */
export class SushiSwapSwapActions extends ActionProvider<EvmWalletProvider> {
  constructor() {
    super("sushiSwap.swap", []);
  }

  /**
   * Fetches a swap quote for a given token pair and amount from SushiSwap’s public API.
   *
   * @param walletProvider - An instance of EVM-compatible WalletProvider
   * @param args - Object containing tokenIn, tokenOut, amount, and optional maxSlippage
   * @returns A formatted string representing the swap quote
   * @throws If token metadata is invalid or the API request fails
   */
  @CreateAction({
    name: "get_swap_quote",
    description: `
  Generates a swap quote for a given token pair and amount on a specific chain.

  Inputs:
  - tokenIn: Address of the input token.
  - tokenOut: Address of the output token.
  - amount: Amount of the input token to swap. Example: 3.5 (will be converted to base units using token decimals)
  - maxSlippage: Optional parameters for route planning. Maximum allowed slippage for the swap is 1, e.g., 0.005 for 0.5%. Default: 0.005 for 0.5%


  Notes:
  - Ensure all addresses are checksummed and valid.
  `,
    schema: GetSwapQuoteSchema,
  })
  async getSwapQuote(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetSwapQuoteSchema>
  ): Promise<any> {
    try {
      const {
        tokenIn,
        tokenOut,
        amount,
        maxSlippage = DEFAULT_MAX_SLIPPAGE,
      } = args;
      const chainId = walletProvider.getNetwork().chainId;

      const tokenMetadata = await fetchTokenMetadata(Number(chainId), tokenIn);

      if (!tokenMetadata?.decimals) {
        throw createError(
          "Failed to fetch token decimals",
          ErrorCode.TOKEN_METADATA_ERROR
        );
      }
      const amountInBaseUnits = new Decimal(amount)
        .mul(new Decimal(10).pow(tokenMetadata.decimals))
        .toFixed(0);

      const params = new URLSearchParams({
        tokenIn,
        tokenOut,
        amount: amountInBaseUnits,
        maxSlippage: maxSlippage.toString(),
      });

      const response = await fetchFromApi<unknown>(
        `${SUSHI_QUOTE_ENDPOINT}/${chainId}?${params}`
      );

      return objectToString(response);
    } catch (error) {
      throw handleError("Failed to generate swap quote", error);
    }
  }

  /**
   * Executes a token swap on SushiSwap using Viem, with automatic approval if necessary.
   *
   * @param walletProvider - An instance of Viem-compatible WalletProvider
   * @param args - Object containing tokenIn, tokenOut, amount, and optional maxSlippage
   * @returns A formatted string containing the transaction hash and simulation result
   * @throws If approval, quote generation, simulation, or transaction sending fails
   */
  @CreateAction({
    name: "execute_swap",
    description: `
    Executes a token swap on SushiSwap using the Viem client.

    Inputs:
    - tokenIn: Address of the input token. Example: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE (native MATIC)
    - tokenOut: Address of the output token. Example: 0xc2132D05D31c914a87C6611C10748AEb04B58e8F (USDT)
    - amount: Amount of the input token to swap. Example: 3.5 (will be converted to base units using token decimals)
    - maxSlippage: Optional maximum allowed slippage for the swap (e.g., 0.005 for 0.5%). Default: 0.005 (0.5%)

    Note: This action will broadcast a transaction on-chain and may consume gas.
  `,
    schema: GetExecuteSwapSchema,
  })
  async executeSwap(
    walletProvider: ViemWalletProvider,
    args: z.infer<typeof GetExecuteSwapSchema>
  ): Promise<any> {
    try {
      const {
        tokenIn,
        tokenOut,
        amount,
        maxSlippage = DEFAULT_MAX_SLIPPAGE,
      } = args;

      const network = walletProvider.getNetwork();
      const chainId = network.chainId;
      const networkId = network.networkId;

      if (!chainId || !networkId) {
        throw createError(
          "Invalid or missing network",
          ErrorCode.INVALID_NETWORK
        );
      }
      const tokenMetadata = await fetchTokenMetadata(Number(chainId), tokenIn);

      if (!tokenMetadata?.decimals) {
        throw createError(
          "Failed to fetch token decimals",
          ErrorCode.TOKEN_METADATA_ERROR
        );
      }
      const amountInBaseUnits = new Decimal(amount)
        .mul(new Decimal(10).pow(tokenMetadata.decimals))
        .toFixed(0);

      const sushiSwapModule = await SushiSwapModule();
      const typedChainId = chainId as keyof typeof sushiSwapModule.getSwap;
      const spender = getSpender(typedChainId);

      if (!isNativeToken(tokenIn)) {
        const currentAllowance = await allowance(
          walletProvider,
          tokenIn,
          spender
        );
        if (currentAllowance < BigInt(amountInBaseUnits)) {
          const approvalResult = await approve(
            walletProvider,
            tokenIn,
            spender,
            BigInt(amountInBaseUnits)
          );
          if (approvalResult.startsWith("Error")) {
            return `Error approving Morpho Vault as spender: ${approvalResult}`;
          } else {
            console.log(approvalResult);
          }
        } else {
          console.log("Sufficient allowance. Skipping approval.");
        }
      } else {
        console.log("Native token detected. No approval needed.");
      }

      // Step 1: Get swap quote
      const swapData = await sushiSwapModule.getSwap({
        chainId: typedChainId,
        tokenIn: tokenIn as `0x${string}`,
        tokenOut: tokenOut as `0x${string}`,
        amount: BigInt(amountInBaseUnits),
        maxSlippage,
        sender: walletProvider.getAddress() as `0x${string}`,
      });

      if (swapData.status !== "Success") {
        throw createError("Swap quote generation failed", "SWAP_QUOTE_FAILED");
      }

      const { tx } = swapData;

      // Step 2: Simulate swap
      // TODO: Remove below code once Katana is available on Viem and is public
      let publicClient: PublicClient;
      if (chainId === "129399") {
        publicClient = createPublicClient({
          chain: walletProvider.getChain(),
          transport: http(),
        });
      } else {
        publicClient = createPublicClient({
          chain: NETWORK_ID_TO_VIEM_CHAIN[networkId],
          transport: http(),
        });
      }

      const simulation = await publicClient.call({
        account: tx.from,
        to: tx.to,
        data: tx.data,
        value: tx.value,
      });

      console.log("Simulated output:", simulation);

      // Step 3: Send transaction
      const txHash = await walletProvider.sendTransaction({
        to: tx.to,
        data: tx.data,
        value: tx.value,
      });
      await walletProvider.waitForTransactionReceipt(txHash);

      return objectToString({
        txHash,
        simulation,
      });
    } catch (error) {
      throw handleError("Failed to execute swap", error);
    }
  }

  supportsNetwork = (network: Network) => network.protocolFamily === "evm";
}
