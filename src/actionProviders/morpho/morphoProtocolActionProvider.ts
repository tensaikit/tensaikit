import { z } from "zod";
import { Decimal } from "decimal.js";
import { encodeFunctionData, Hex, parseUnits } from "viem";
import { CreateAction } from "../actionDecorator";
import { ActionProvider } from "../actionProvider";
import { EvmWalletProvider } from "../../walletProviders";
import { Network } from "../../network";
import {
  BorrowSchema,
  GetMarketInfoSchema,
  RepaySchema,
  SupplyCollateralSchema,
  SupplySchema,
  WithdrawCollateralSchema,
  WithdrawSchema,
} from "./schemas";
import { abi as ERC20_ABI } from "../erc20/constants";
import { allowance, approve } from "../../utils";
import { MORPHO_BLUE_ABI } from "./abi/morphoBlueABI";
import { createError, ErrorCode, handleError } from "../../common/errors";
import { objectToString } from "../../common/utils/objectToString";
import {
  getMorphoBlueContractAddress,
  MORPHO_SUPPORTED_PROTOCOL,
} from "./utils";
import { wrapAndStringify } from "../../common/utils";

/**
 * MorphoProtocolActionProvider is an action provider for Morpho Vault interactions.
 */
export class MorphoProtocolActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Creates a new instance of Morpho Protocol Action Provider
   *
   */
  constructor() {
    super("morpho.protocol", []);
  }

  /**
   * Fetches Morpho Blue market details using a given market ID.
   *
   * @param walletProvider - Instance of EvmWalletProvider used to interact with the chain.
   * @param marketId - The unique bytes32 identifier for the Morpho market.
   * @returns Market parameters returned by the `idToMarketParams` function.
   * @throws Will throw an error if:
   *   - The network or chainId is invalid.
   *   - The market ID is invalid or returns no information.
   */
  @CreateAction({
    name: "get_market_info",
    description: `
    This action fetches detailed parameters of a Morpho Blue market using a given market ID.

    Inputs:
    - marketId: Unique ID of the market (bytes32 hash)

    The response includes:
    - loanToken
    - collateralToken
    - oracle
    - interest rate model
    - max loan-to-value (LLTV)

    Use this to inspect market configuration before interacting with it.
    Example valid marketId:
    0x10b2d9edc87a5b62f8a6ac3a274b248e7219060d594617c41147c1ef116faee3
  `,
    schema: GetMarketInfoSchema,
  })
  async getMarketInfo(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetMarketInfoSchema>
  ): Promise<string> {
    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    if (!chainId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const morphoBlueContractAddress = getMorphoBlueContractAddress(
      Number(chainId)
    ) as Hex;

    try {
      const marketResponse = await walletProvider.readContract({
        address: morphoBlueContractAddress,
        abi: MORPHO_BLUE_ABI,
        functionName: "idToMarketParams",
        args: [args.marketId],
      });

      if (!marketResponse) {
        throw createError(
          "Invalid market id or missing market information",
          ErrorCode.INVALID_INPUT
        );
      }
      const loanToken = marketResponse[0];
      const collateralToken = marketResponse[1];
      const oracle = marketResponse[2];
      const irm = marketResponse[3];
      const lltv = marketResponse[4];

      return wrapAndStringify(
        "morpho.protocol.get_market_info",
        [
          `Market Info for ID: ${args.marketId} \n`,
          `--------------------------------`,
          `• Loan Token:        ${loanToken}`,
          `• Collateral Token:  ${collateralToken}`,
          `• Oracle:            ${oracle}`,
          `• Interest Rate Model (IRM): ${irm}`,
          `• Max LLTV (Loan-to-Value):  ${lltv.toString()}`,
        ].join("\n")
      );
    } catch (error) {
      throw handleError("Error depositing to Morpho Vault", error);
    }
  }

  /**
   * Supplies loanToken assets to a Morpho Blue market using a specific market ID.
   *
   * @param walletProvider - Instance of EvmWalletProvider used to interact with the chain.
   * @param args - Contains:
   *   - marketId: The unique bytes32 identifier for the Morpho market.
   *   - assets: The amount of loanToken to be supplied, provided as a decimal string (e.g., "1.0", "0.5").
   *
   * @returns A string summarizing the transaction, including the hash and receipt.
   *
   * @throws Will throw an error if:
   *   - The asset amount is zero or negative.
   *   - Network information is invalid or missing.
   *   - Market ID is invalid or returns no information.
   *   - The approve or transaction functions fail.
   */
  @CreateAction({
    name: "supply",
    description: `
    This action allows supplying loanToken assets to a Morpho Blue market using a market ID.

    Inputs:
    - marketId: Unique ID of the market (bytes32 hash)
    - assets: The amount of assets to deposit in whole units
      Examples for WETH:
      - 1 WETH
      - 0.1 WETH
      - 0.01 WETH

    Make sure the market is active and the asset will be approved by the function.
    Important notes:
    - Make sure to use the exact amount provided. Do not convert units for assets for this action.
    - Please use a market id (example 0x65086b4f89ea71ea533af56a6b4075e0f16a52879e17b091f6658a18d96177e5) for the marketId field.`,
    schema: SupplySchema,
  })
  async supply(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof SupplySchema>
  ): Promise<string> {
    const assets = new Decimal(args.assets);

    if (assets.lessThanOrEqualTo(0)) {
      return wrapAndStringify(
        "morpho.protocol.supply",
        "Error: Assets amount must be greater than 0"
      );
    }

    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    if (!chainId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const morphoBlueContractAddress = getMorphoBlueContractAddress(
      Number(chainId)
    ) as Hex;

    try {
      const marketResponse = await walletProvider.readContract({
        address: morphoBlueContractAddress,
        abi: MORPHO_BLUE_ABI,
        functionName: "idToMarketParams",
        args: [args.marketId],
      });

      if (!marketResponse) {
        throw createError(
          "Invalid market id or missing market information",
          ErrorCode.INVALID_INPUT
        );
      }
      const loanToken = marketResponse[0];

      const decimals = await walletProvider.readContract({
        address: loanToken,
        abi: ERC20_ABI,
        functionName: "decimals",
        args: [],
      });
      const atomicAssets = parseUnits(args.assets, decimals);

      const currentAllowance = await allowance(
        walletProvider,
        loanToken,
        morphoBlueContractAddress
      );

      if (currentAllowance < atomicAssets) {
        const approvalResult = await approve(
          walletProvider,
          loanToken,
          morphoBlueContractAddress,
          atomicAssets
        );
        if (approvalResult.startsWith("Error")) {
          return wrapAndStringify(
            "morpho.protocol.supply",
            `Error approving Morpho Vault as spender: ${approvalResult}`
          );
        } else {
          console.log(approvalResult);
        }
      }

      const data = encodeFunctionData({
        abi: MORPHO_BLUE_ABI,
        functionName: "supply",
        args: [
          marketResponse,
          atomicAssets,
          BigInt(0),
          walletProvider.getAddress(),
          "0x",
        ],
      });

      const txHash = await walletProvider.sendTransaction({
        to: morphoBlueContractAddress,
        data,
      });

      const receipt = await walletProvider.waitForTransactionReceipt(txHash);

      return wrapAndStringify(
        "morpho.protocol.supply",
        `Deposited ${
          args.assets
        } tokens (loanToken: ${loanToken}) to Morpho Market Id ${
          args.marketId
        } with transaction hash: ${txHash}\nTransaction receipt: ${objectToString(
          receipt
        )}`
      );
    } catch (error) {
      throw handleError("Error depositing to Morpho Vault", error);
    }
  }

  /**
   * Withdraws loanToken assets from a Morpho Blue market using a specific market ID.
   *
   * @param walletProvider - Instance of EvmWalletProvider used to interact with the chain.
   * @param args - Contains:
   *   - marketId: The unique bytes32 identifier for the Morpho market.
   *   - assets: The amount of loanToken to be withdrawn, provided as a decimal string.
   *
   * @returns A string summarizing the transaction, including the hash and receipt.
   *
   * @throws Will throw an error if:
   *   - The asset amount is zero or negative.
   *   - Network information is invalid or missing.
   *   - Market ID is invalid or returns no information.
   *   - The transaction fails.
   */
  @CreateAction({
    name: "withdraw",
    description: `
    This action allows withdrawing loanToken assets from a Morpho Blue market using a market ID.

    Inputs:
    - marketId: Unique ID of the market (bytes32 hash)
    - assets: The amount of assets to withdraw in whole units
      Examples for USDC (6 decimals):
      - 1 USDC
      - 0.5 USDC
      - 0.01 USDC

    Make sure the market is active, and the withdrawable balance is available.

    Important notes:
    - Do not convert units manually; input the asset amount as a decimal string.
    - Please use a valid market ID (example: 0x65086b4f89ea71ea533af56a6b4075e0f16a52879e17b091f6658a18d96177e5).
  `,
    schema: WithdrawSchema, // You may want to rename this to `WithdrawSchema` if it's a different zod schema
  })
  async withdraw(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof WithdrawSchema> // Change to WithdrawSchema if separate
  ): Promise<string> {
    const assets = new Decimal(args.assets);

    if (assets.lessThanOrEqualTo(0)) {
      return wrapAndStringify(
        "morpho.protocol.withdraw",
        "Error: Assets amount must be greater than 0"
      );
    }

    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    if (!chainId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const morphoBlueContractAddress = getMorphoBlueContractAddress(
      Number(chainId)
    ) as Hex;
    try {
      const marketResponse = await walletProvider.readContract({
        address: morphoBlueContractAddress,
        abi: MORPHO_BLUE_ABI,
        functionName: "idToMarketParams",
        args: [args.marketId],
      });

      if (!marketResponse) {
        throw createError(
          "Invalid market id or missing market information",
          ErrorCode.INVALID_INPUT
        );
      }
      const loanToken = marketResponse[0];

      const decimals = await walletProvider.readContract({
        address: loanToken,
        abi: ERC20_ABI,
        functionName: "decimals",
        args: [],
      });
      const atomicAssets = parseUnits(args.assets, decimals);

      const data = encodeFunctionData({
        abi: MORPHO_BLUE_ABI,
        functionName: "withdraw",
        args: [
          marketResponse,
          atomicAssets,
          BigInt(0),
          walletProvider.getAddress(),
          walletProvider.getAddress(),
        ],
      });

      const txHash = await walletProvider.sendTransaction({
        to: morphoBlueContractAddress,
        data,
      });

      const receipt = await walletProvider.waitForTransactionReceipt(txHash);

      return wrapAndStringify(
        "morpho.protocol.withdraw",
        `Withdrew  ${
          args.assets
        } tokens (loanToken: ${loanToken}) from Morpho Market ID ${
          args.marketId
        } with transaction hash: ${txHash}\nTransaction receipt: ${objectToString(
          receipt
        )}`
      );
    } catch (error) {
      throw handleError("Error withdrawing from Morpho Vault", error);
    }
  }

  /**
   * Supplies collateralToken assets to a Morpho Blue market using a specific market ID.
   *
   * @param walletProvider - Instance of EvmWalletProvider used to interact with the chain.
   * @param args - Contains:
   *   - marketId: The unique bytes32 identifier for the Morpho market.
   *   - assets: The amount of collateralToken to be supplied, provided as a decimal string.
   *
   * @returns A string summarizing the transaction, including the hash and receipt.
   *
   * @throws Will throw an error if:
   *   - The asset amount is zero or negative.
   *   - Network information is invalid or missing.
   *   - Market ID is invalid or returns no information.
   *   - The approve or transaction functions fail.
   */
  @CreateAction({
    name: "supply_collateral",
    description: `
    This action allows supplying collateralToken assets to a Morpho Blue market using a market ID.

    Inputs:
    - marketId: Unique ID of the market (bytes32 hash)
    - assets: The amount of assets to deposit in whole units
      Examples for WETH:
      - 1 WETH
      - 0.1 WETH
      - 0.01 WETH

    Make sure the market is active and the asset will be approved by the function.
    Important notes:
    - Make sure to use the exact amount provided. Do not convert units for assets for this action.
    - Please use a market id (example 0x65086b4f89ea71ea533af56a6b4075e0f16a52879e17b091f6658a18d96177e5) for the marketId field.`,
    schema: SupplyCollateralSchema,
  })
  async supplyCollateral(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof SupplyCollateralSchema>
  ): Promise<string> {
    const assets = new Decimal(args.assets);

    if (assets.lessThanOrEqualTo(0)) {
      return wrapAndStringify(
        "morpho.protocol.supply_collateral",
        "Error: Assets amount must be greater than 0"
      );
    }

    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    if (!chainId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const morphoBlueContractAddress = getMorphoBlueContractAddress(
      Number(chainId)
    ) as Hex;

    try {
      const marketResponse = await walletProvider.readContract({
        address: morphoBlueContractAddress,
        abi: MORPHO_BLUE_ABI,
        functionName: "idToMarketParams",
        args: [args.marketId],
      });

      if (!marketResponse) {
        throw createError(
          "Invalid market id or missing market information",
          ErrorCode.INVALID_INPUT
        );
      }
      const collateralToken = marketResponse[1];

      const decimals = await walletProvider.readContract({
        address: collateralToken,
        abi: ERC20_ABI,
        functionName: "decimals",
        args: [],
      });
      const atomicAssets = parseUnits(args.assets, decimals);

      const currentAllowance = await allowance(
        walletProvider,
        collateralToken,
        morphoBlueContractAddress
      );

      if (currentAllowance < atomicAssets) {
        const approvalResult = await approve(
          walletProvider,
          collateralToken,
          morphoBlueContractAddress,
          atomicAssets
        );
        if (approvalResult.startsWith("Error")) {
          return wrapAndStringify(
            "morpho.protocol.supply_collateral",
            `Error approving Morpho Vault as spender: ${approvalResult}`
          );
        } else {
          console.log(approvalResult);
        }
      }

      const data = encodeFunctionData({
        abi: MORPHO_BLUE_ABI,
        functionName: "supplyCollateral",
        args: [marketResponse, atomicAssets, walletProvider.getAddress(), "0x"],
      });

      const txHash = await walletProvider.sendTransaction({
        to: morphoBlueContractAddress,
        data,
      });

      const receipt = await walletProvider.waitForTransactionReceipt(txHash);

      return wrapAndStringify(
        "morpho.protocol.supply_collateral",
        `Supplied collateral ${
          args.assets
        } tokens (loanToken: ${collateralToken}) to Morpho Market Id ${
          args.marketId
        } with transaction hash: ${txHash}\nTransaction receipt: ${objectToString(
          receipt
        )}`
      );
    } catch (error) {
      throw handleError("Error depositing to Morpho Vault", error);
    }
  }

  /**
   * Withdraws collateralToken assets from a Morpho Blue market using a specific market ID.
   *
   * @param walletProvider - Instance of EvmWalletProvider used to interact with the chain.
   * @param args - Contains:
   *   - marketId: The unique bytes32 identifier for the Morpho market.
   *   - assets: The amount of collateralToken to be withdrawn, provided as a decimal string.
   *
   * @returns A string summarizing the transaction, including the hash and receipt.
   *
   * @throws Will throw an error if:
   *   - The asset amount is zero or negative.
   *   - Network information is invalid or missing.
   *   - Market ID is invalid or returns no information.
   *   - The transaction fails.
   */
  @CreateAction({
    name: "withdraw_collateral",
    description: `
    This action allows withdrawing collateralToken assets from a Morpho Blue market using a market ID.

    Inputs:
    - marketId: Unique ID of the market (bytes32 hash)
    - assets: The amount of assets to withdraw in whole units
      Examples for USDC (6 decimals):
      - 1 USDC
      - 0.5 USDC
      - 0.01 USDC

    Make sure the market is active, and the withdrawable balance is available.

    Important notes:
    - Do not convert units manually; input the asset amount as a decimal string.
    - Please use a valid market ID (example: 0x65086b4f89ea71ea533af56a6b4075e0f16a52879e17b091f6658a18d96177e5).
  `,
    schema: WithdrawCollateralSchema, // You may want to rename this to `WithdrawSchema` if it's a different zod schema
  })
  async withdrawCollateral(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof WithdrawCollateralSchema> // Change to WithdrawSchema if separate
  ): Promise<string> {
    const assets = new Decimal(args.assets);

    if (assets.lessThanOrEqualTo(0)) {
      return wrapAndStringify(
        "morpho.protocol.withdraw_collateral",
        "Error: Assets amount must be greater than 0"
      );
    }

    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    if (!chainId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const morphoBlueContractAddress = getMorphoBlueContractAddress(
      Number(chainId)
    ) as Hex;
    try {
      const marketResponse = await walletProvider.readContract({
        address: morphoBlueContractAddress,
        abi: MORPHO_BLUE_ABI,
        functionName: "idToMarketParams",
        args: [args.marketId],
      });

      if (!marketResponse) {
        throw createError(
          "Invalid market id or missing market information",
          ErrorCode.INVALID_INPUT
        );
      }
      const collateralToken = marketResponse[1];

      const decimals = await walletProvider.readContract({
        address: collateralToken,
        abi: ERC20_ABI,
        functionName: "decimals",
        args: [],
      });
      const atomicAssets = parseUnits(args.assets, decimals);

      const data = encodeFunctionData({
        abi: MORPHO_BLUE_ABI,
        functionName: "withdrawCollateral",
        args: [
          marketResponse,
          atomicAssets,
          walletProvider.getAddress(),
          walletProvider.getAddress(),
        ],
      });

      const txHash = await walletProvider.sendTransaction({
        to: morphoBlueContractAddress,
        data,
      });

      const receipt = await walletProvider.waitForTransactionReceipt(txHash);

      return wrapAndStringify(
        "morpho.protocol.withdraw_collateral",
        `Withdrew collateral ${
          args.assets
        } tokens (collateralToken: ${collateralToken}) from Morpho Market ID ${
          args.marketId
        } with transaction hash: ${txHash}\nTransaction receipt: ${objectToString(
          receipt
        )}`
      );
    } catch (error) {
      throw handleError("Error withdrawing from Morpho Vault", error);
    }
  }

  /**
   * Borrows loanToken assets from a Morpho Blue market using a specific market ID.
   *
   * @param walletProvider - Instance of EvmWalletProvider used to interact with the chain.
   * @param args - Contains:
   *   - marketId: The unique bytes32 identifier for the Morpho market.
   *   - assets: The amount of loanToken to be borrowed, provided as a decimal string.
   *
   * @returns A string summarizing the transaction, including the hash and receipt.
   *
   * @throws Will throw an error if:
   *   - The asset amount is zero or negative.
   *   - Network information is invalid or missing.
   *   - Market ID is invalid or returns no information.
   *   - The transaction fails.
   */
  @CreateAction({
    name: "borrow",
    description: `
    This action allows borrowing loanToken assets from a Morpho Blue market using a market ID.

    Inputs:
    - marketId: Unique ID of the market (bytes32 hash)
    - assets: The amount of loanToken to borrow in whole units (e.g., 1 USDC, 0.5 DAI)
      Examples for USDC (6 decimals):
      - 1 USDC
      - 0.5 USDC
      - 0.01 USDC

    Make sure:
    - The market exists and is active.
    - You have deposited sufficient collateral in the market.
    - You pass a valid marketId (e.g. 0x65086b4f89ea71ea533af56a6b4075e0f16a52879e17b091f6658a18d96177e5).
  `,
    schema: BorrowSchema,
  })
  async borrow(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof BorrowSchema>
  ): Promise<string> {
    const assets = new Decimal(args.assets);

    if (assets.lessThanOrEqualTo(0)) {
      return wrapAndStringify(
        "morpho.protocol.borrow",
        "Error: Assets amount must be greater than 0"
      );
    }

    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    if (!chainId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const morphoBlueContractAddress = getMorphoBlueContractAddress(
      Number(chainId)
    ) as Hex;

    try {
      const marketResponse = await walletProvider.readContract({
        address: morphoBlueContractAddress,
        abi: MORPHO_BLUE_ABI,
        functionName: "idToMarketParams",
        args: [args.marketId],
      });

      if (!marketResponse) {
        throw createError(
          "Invalid market id or missing market information",
          ErrorCode.INVALID_INPUT
        );
      }
      const loanToken = marketResponse[0];

      const decimals = await walletProvider.readContract({
        address: loanToken,
        abi: ERC20_ABI,
        functionName: "decimals",
        args: [],
      });

      const atomicAssets = parseUnits(args.assets, decimals);

      const data = encodeFunctionData({
        abi: MORPHO_BLUE_ABI,
        functionName: "borrow",
        args: [
          marketResponse,
          atomicAssets,
          BigInt(0),
          walletProvider.getAddress(),
          walletProvider.getAddress(),
        ],
      });

      const txHash = await walletProvider.sendTransaction({
        to: morphoBlueContractAddress,
        data,
      });

      const receipt = await walletProvider.waitForTransactionReceipt(txHash);

      return wrapAndStringify(
        "morpho.protocol.borrow",
        `Borrowed ${
          args.assets
        } tokens (loanToken: ${loanToken}) from Morpho Market ID ${
          args.marketId
        } with transaction hash: ${txHash}\nTransaction receipt: ${objectToString(
          receipt
        )}`
      );
    } catch (error) {
      throw handleError("Error borrowing from Morpho Vault", error);
    }
  }

  /**
   * Repays loanToken debt in a Morpho Blue market using a specific market ID.
   *
   * @param walletProvider - Instance of EvmWalletProvider used to interact with the chain.
   * @param args - Contains:
   *   - marketId: The unique bytes32 identifier for the Morpho market.
   *   - assets: The amount of loanToken to be repaid, provided as a decimal string.
   *
   * @returns A string summarizing the transaction, including the hash and receipt.
   *
   * @throws Will throw an error if:
   *   - The asset amount is zero or negative.
   *   - Network information is invalid or missing.
   *   - Market ID is invalid or returns no information.
   *   - The approve or transaction functions fail.
   */
  @CreateAction({
    name: "repay",
    description: `
    This action allows repaying loanToken debt in a Morpho Blue market using a market ID.

    Inputs:
    - marketId: Unique ID of the market (bytes32 hash)
    - assets: The amount of assets to repay (in whole units)
    
    Notes:
    - Shares is set to 0, meaning assets will be used directly.
    - onBehalf is your own address.
    - Example marketId: 0x65086b4f89ea71ea533af56a6b4075e0f16a52879e17b091f6658a18d96177e5
  `,
    schema: RepaySchema,
  })
  async repay(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof RepaySchema>
  ): Promise<string> {
    const assets = new Decimal(args.assets);

    if (assets.lessThanOrEqualTo(0)) {
      return wrapAndStringify(
        "morpho.protocol.repay",
        "Error: Assets amount must be greater than 0"
      );
    }

    const network = walletProvider.getNetwork();
    const chainId = network.chainId;
    if (!chainId) {
      throw createError(
        "Invalid or missing network",
        ErrorCode.INVALID_NETWORK
      );
    }

    const morphoBlueContractAddress = getMorphoBlueContractAddress(
      Number(chainId)
    ) as Hex;

    try {
      const marketResponse = await walletProvider.readContract({
        address: morphoBlueContractAddress,
        abi: MORPHO_BLUE_ABI,
        functionName: "idToMarketParams",
        args: [args.marketId],
      });

      if (!marketResponse) {
        throw createError(
          "Invalid market id or missing market information",
          ErrorCode.INVALID_INPUT
        );
      }
      const loanToken = marketResponse[0];

      const decimals = await walletProvider.readContract({
        address: loanToken,
        abi: ERC20_ABI,
        functionName: "decimals",
        args: [],
      });
      const atomicAssets = parseUnits(args.assets, decimals);

      const currentAllowance = await allowance(
        walletProvider,
        loanToken,
        morphoBlueContractAddress
      );

      if (currentAllowance < atomicAssets) {
        const approvalResult = await approve(
          walletProvider,
          loanToken,
          morphoBlueContractAddress,
          atomicAssets
        );
        if (approvalResult.startsWith("Error")) {
          return wrapAndStringify(
            "morpho.protocol.repay",
            `Error approving Morpho Vault as spender: ${approvalResult}`
          );
        } else {
          console.log(approvalResult);
        }
      }

      const data = encodeFunctionData({
        abi: MORPHO_BLUE_ABI,
        functionName: "repay",
        args: [
          marketResponse,
          atomicAssets,
          BigInt(0),
          walletProvider.getAddress(),
          "0x",
        ],
      });

      const txHash = await walletProvider.sendTransaction({
        to: morphoBlueContractAddress,
        data,
      });

      const receipt = await walletProvider.waitForTransactionReceipt(txHash);

      return wrapAndStringify(
        "morpho.protocol.repay",
        `Repaid ${
          args.assets
        } of tokens (loanToken: ${loanToken}) from Morpho Market ID ${
          args.marketId
        } with transaction hash: ${txHash}\nTransaction receipt: ${objectToString(
          receipt
        )}`
      );
    } catch (error) {
      throw handleError("Error repaying to Morpho Vault", error);
    }
  }

  supportsNetwork = (network: Network) => {
    console.log("network", network);
    return (
      network.protocolFamily === "evm" &&
      MORPHO_SUPPORTED_PROTOCOL.includes(network.networkId!)
    );
  };
}

export const morphoProtocolActionProvider = () =>
  new MorphoProtocolActionProvider();
