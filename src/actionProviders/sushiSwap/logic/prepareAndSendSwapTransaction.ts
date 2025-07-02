import Decimal from "decimal.js";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { ViemWalletProvider } from "../../../walletProviders";
import { fetchTokenMetadata } from "./fetchTokenMetadata";
import { getSpender, SushiSwapModule } from "../utlis";
import { allowance, approve, isNativeToken } from "../../../utils";
import { createPublicClient, http, PublicClient } from "viem";
import { NETWORK_ID_TO_VIEM_CHAIN } from "../../../network";

/**
 * Prepares and sends a token swap transaction via the SushiSwap module using the provided wallet provider.
 *
 * This function handles the full lifecycle of a swap:
 * 1. Validates network and chain information from the wallet provider.
 * 2. Fetches token metadata to convert the input amount into base units.
 * 3. Checks and sets token allowance if needed.
 * 4. Fetches the swap calldata from the SushiSwap module.
 * 5. Simulates the transaction using Viem’s `publicClient.call` (for dry-run).
 * 6. Sends the transaction using the wallet provider and waits for confirmation.
 *
 * @param walletProvider - A Viem-compatible wallet provider to interact with the blockchain.
 * @param args - Swap details:
 *   - tokenIn: Address of the input token.
 *   - tokenOut: Address of the output token.
 *   - maxSlippage: Maximum allowed slippage for the trade (in percent).
 *   - amount: Human-readable input amount (e.g., 1.5 ETH).
 *
 * @returns A promise resolving to the transaction hash if successful.
 *          If approval fails, returns an error string.
 * @throws Throws a formatted error if any stage in the swap process fails.
 */
export const prepareAndSendSwapTransaction = async (
  walletProvider: ViemWalletProvider,
  args: {
    tokenIn: string;
    tokenOut: string;
    maxSlippage: number;
    amount: number;
  }
) => {
  try {
    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    const networkId = network.networkId;

    if (!chainId || !networkId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const tokenMetadata = await fetchTokenMetadata(chainId, args.tokenIn);

    if (!tokenMetadata?.decimals) {
      throw createError(
        "Failed to fetch token decimals",
        ErrorCode.TOKEN_METADATA_ERROR
      );
    }
    const amountInBaseUnits = new Decimal(args.amount)
      .mul(new Decimal(10).pow(tokenMetadata.decimals))
      .toFixed(0);

    const sushiSwapModule = await SushiSwapModule();
    const typedChainId = chainId as keyof typeof sushiSwapModule.getSwap;
    const spender = getSpender(typedChainId);

    if (!isNativeToken(args.tokenIn)) {
      const currentAllowance = await allowance(
        walletProvider,
        args.tokenIn,
        spender
      );
      if (currentAllowance < BigInt(amountInBaseUnits)) {
        const approvalResult = await approve(
          walletProvider,
          args.tokenIn,
          spender,
          BigInt(amountInBaseUnits)
        );
        if (approvalResult.startsWith("Error")) {
          return `Error approving SushiSwap as spender: ${approvalResult}`;
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
      tokenIn: args.tokenIn as `0x${string}`,
      tokenOut: args.tokenOut as `0x${string}`,
      amount: BigInt(amountInBaseUnits),
      maxSlippage: args.maxSlippage,
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

    return `Swap transaction successful. Transaction Hash: ${txHash}`;
  } catch (error: any) {
    throw handleError("Failed to prepare and send swap transaction", error);
  }
};
