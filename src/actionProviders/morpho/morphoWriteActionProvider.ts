import { z } from "zod";
import { CreateAction } from "../actionDecorator";
import { ActionProvider } from "../actionProvider";
import { EvmWalletProvider } from "../../walletProviders";
import { Network } from "../../network";
import {
  BorrowSchema,
  RepaySchema,
  SupplyCollateralSchema,
  SupplySchema,
  WithdrawCollateralSchema,
  WithdrawSchema,
} from "./schemas";
import { handleError } from "../../common/errors";
import { objectToString } from "../../common/utils/objectToString";
import { MORPHO_SUPPORTED_PROTOCOL } from "./utils";
import { wrapAndStringify } from "../../common/utils";
import {
  writeBorrowLoan,
  writeRepayLoan,
  writeSupplyCollateralToken,
  writeSupplyLoanToken,
  writeWithdrawCollateralToken,
  writeWithdrawLoanToken,
} from "./logic";

/**
 * MorphoWriteActionProvider is an action provider to write into Morpho Vault.
 */
export class MorphoWriteActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Creates a new instance of Morpho Protocol Action Provider
   *
   */
  constructor() {
    super("morpho.write_action", []);
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
    name: "supply_loan_asset",
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
  async supplyLoanAsset(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof SupplySchema>
  ): Promise<string> {
    try {
      const response = await writeSupplyLoanToken(walletProvider, args);

      return wrapAndStringify(
        "morpho.write_action.supply_loan_asset",
        `Deposited ${args.assets} tokens (loanToken: ${
          response.loanToken
        }) to Morpho Market Id ${args.marketId} with transaction hash: ${
          response.txHash
        }\nTransaction receipt: ${objectToString(response.receipt)}`
      );
    } catch (error) {
      throw handleError("Error supplying loan token to Morpho Vault", error);
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
    name: "withdraw_loan_asset",
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
  async withdrawLoanAsset(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof WithdrawSchema> // Change to WithdrawSchema if separate
  ): Promise<string> {
    try {
      const response = await writeWithdrawLoanToken(walletProvider, args);

      return wrapAndStringify(
        "morpho.write_action.withdraw_loan_asset",
        `Withdrew  ${args.assets} tokens (loanToken: ${
          response.loanToken
        }) from Morpho Market ID ${args.marketId} with transaction hash: ${
          response.txHash
        }\nTransaction receipt: ${objectToString(response.receipt)}`
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
    name: "supply_collateral_loan_asset",
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
  async supplyCollateralLoanAsset(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof SupplyCollateralSchema>
  ): Promise<string> {
    try {
      const response = await writeSupplyCollateralToken(walletProvider, args);

      return wrapAndStringify(
        "morpho.write_action.supply_collateral_loan_asset",
        `Supplied collateral ${args.assets} tokens (loanToken: ${
          response.collateralToken
        }) to Morpho Market Id ${args.marketId} with transaction hash: ${
          response.txHash
        }\nTransaction receipt: ${objectToString(response.receipt)}`
      );
    } catch (error) {
      throw handleError("Error supplying collateral to Morpho Vault", error);
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
    name: "withdraw_collateral_loan_asset",
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
  async withdrawCollateralLoanAsset(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof WithdrawCollateralSchema> // Change to WithdrawSchema if separate
  ): Promise<string> {
    try {
      const response = await writeWithdrawCollateralToken(walletProvider, args);

      return wrapAndStringify(
        "morpho.write_action.withdraw_collateral_loan_asset",
        `Withdrew collateral ${args.assets} tokens (collateralToken: ${
          response.collateralToken
        }) from Morpho Market ID ${args.marketId} with transaction hash: ${
          response.txHash
        }\nTransaction receipt: ${objectToString(response.receipt)}`
      );
    } catch (error) {
      throw handleError(
        "Failed to withdraw collateral token from Morpho Vault",
        error
      );
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
    name: "borrow_loan_asset",
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
  async borrowLoanAsset(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof BorrowSchema>
  ): Promise<string> {
    try {
      const response = await writeBorrowLoan(walletProvider, args);

      return wrapAndStringify(
        "morpho.write_action.borrow_loan_asset",
        `Borrowed ${args.assets} tokens (loanToken: ${
          response.loanToken
        }) from Morpho Market ID ${args.marketId} with transaction hash: ${
          response.txHash
        }\nTransaction receipt: ${objectToString(response.receipt)}`
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
    name: "repay_loan_asset",
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
    try {
      const response = await writeRepayLoan(walletProvider, args);

      return wrapAndStringify(
        "morpho.write_action.repay_loan_asset",
        `Repaid ${args.assets} of tokens (loanToken: ${
          response.loanToken
        }) from Morpho Market ID ${args.marketId} with transaction hash: ${
          response.txHash
        }\nTransaction receipt: ${objectToString(response.receipt)}`
      );
    } catch (error) {
      throw handleError("Error repaying to Morpho Vault", error);
    }
  }

  supportsNetwork = (network: Network) => {
    return (
      network.protocolFamily === "evm" &&
      MORPHO_SUPPORTED_PROTOCOL.includes(network.networkId!)
    );
  };
}

export const morphoWriteActionProvider = () => new MorphoWriteActionProvider();
