import { z } from "zod";
import { CreateAction } from "../actionDecorator";
import { ActionProvider } from "../actionProvider";
import { EvmWalletProvider } from "../../walletProviders";
import { Network } from "../../network";
import {
  GetMarketInfoSchema,
  GetMarketPositionInfoSchema,
  GetMarketStatesSchema,
} from "./schemas";
import { handleError } from "../../common/errors";
import { MORPHO_SUPPORTED_PROTOCOL } from "./utils";
import { wrapAndStringify } from "../../common/utils";
import {
  fetchMarketConfigFromContract,
  fetchMarketStateFromContract,
  fetchPositionInfoFromContract,
} from "./logic";

/**
 * MorphoReadActionProvider is an action provider to read from Morpho Vault.
 */
export class MorphoReadActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Creates a new instance of Morpho Protocol Action Provider
   *
   */
  constructor() {
    super("morpho.read_action", []);
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
    name: "fetch_market_config",
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
  async fetchMarketConfig(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetMarketInfoSchema>
  ): Promise<string> {
    try {
      const response = await fetchMarketConfigFromContract(
        walletProvider,
        args
      );

      return wrapAndStringify(
        "morpho.read_action.fetch_market_config",
        [
          `Market Info for ID: ${args.marketId} \n`,
          `--------------------------------`,
          `• Loan Token:        ${response.loanToken}`,
          `• Collateral Token:  ${response.collateralToken}`,
          `• Oracle:            ${response.oracle}`,
          `• Interest Rate Model (IRM): ${response.irm}`,
          `• Max LLTV (Loan-to-Value):  ${response.lltv.toString()}`,
        ].join("\n")
      );
    } catch (error) {
      throw handleError("Error fetching Morpho Vault Information", error);
    }
  }

  /**
   * Retrieves the wallet's current position in a specified Morpho Blue market.
   *
   * This method queries the Morpho Blue contract to determine how many supply shares,
   * borrow shares, and how much collateral the connected wallet currently holds.
   * It's useful for users tracking their DeFi lending/borrowing status.
   *
   * @param walletProvider - Connected EVM wallet instance.
   * @param args - Validated input containing a bytes32 `marketId` identifying the market.
   *
   * @returns A Promise resolving to a formatted string displaying:
   *  - Market ID
   *  - Supply Shares
   *  - Borrow Shares
   *  - Collateral
   *
   * @throws Will throw an error if:
   *  - The network is not detected or invalid.
   *  - The market ID is not recognized on-chain.
   *  - An error occurs during contract read.
   */
  @CreateAction({
    name: "fetch_wallet_position",
    description: `
    This action fetches the connected wallet's position in a specific Morpho Blue market.

    Inputs:
    - marketId: Unique ID of the market (bytes32 hash)

    The response includes:
    - supplyShares: How much the user has supplied to the market.
    - borrowShares: How much the user has borrowed from the market.
    - collateral: The amount of collateral the user has deposited.

    Use this to monitor your lending/borrowing state in a given Morpho market.
    Example valid marketId:
    0x10b2d9edc87a5b62f8a6ac3a274b248e7219060d594617c41147c1ef116faee3
  `,
    schema: GetMarketInfoSchema,
  })
  async fetchWalletPosition(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetMarketPositionInfoSchema>
  ): Promise<string> {
    try {
      const response = await fetchPositionInfoFromContract(
        walletProvider,
        args
      );

      return wrapAndStringify(
        "morpho.read_action.fetch_wallet_position",
        [
          `Market Position Info for ID: ${args.marketId} \n`,
          `--------------------------------`,
          `• Supply Shares:        ${response.supplyShares}`,
          `• Borrow Shares:  ${response.borrowShares}`,
          `• Collateral:            ${response.collateral}`,
        ].join("\n")
      );
    } catch (error) {
      throw handleError("Error fetching Morpho Vault Information", error);
    }
  }

  /**
   * Retrieves the current state of a specified Morpho Blue market.
   *
   * This method queries the Morpho Blue contract to get real-time global parameters
   * of a lending market — including total supply/borrowed assets, shares, protocol fee,
   * and the last update timestamp. It’s useful for understanding market health,
   * utilization, and fee configuration.
   *
   * @param walletProvider - Connected EVM wallet instance.
   * @param args - Validated input containing a bytes32 `marketId` identifying the market.
   *
   * @returns A Promise resolving to a formatted string displaying:
   *  - Market ID
   *  - Total Supply Assets
   *  - Total Supply Shares
   *  - Total Borrow Assets
   *  - Total Borrow Shares
   *  - Last Update Timestamp
   *  - Fee
   *
   * @throws Will throw an error if:
   *  - The network is not detected or invalid.
   *  - The market ID is not recognized or lacks state data on-chain.
   *  - An error occurs during the contract read operation.
   */
  @CreateAction({
    name: "fetch_market_state",
    description: `
    This action fetches the current global state of a specific Morpho Blue market.

  Inputs:
  - marketId: Unique ID of the market (bytes32 hash)

  The response includes:
  - totalSupplyAssets: Total assets supplied to the market.
  - totalSupplyShares: Total shares issued to suppliers.
  - totalBorrowAssets: Total amount borrowed from the market.
  - totalBorrowShares: Total shares issued to borrowers.
  - lastUpdate: Timestamp of the last market update (e.g., interest accrual).
  - fee: Protocol fee associated with the market.

    Use this to inspect real-time state of a market for APY, utilization, or health computations.
    Example valid marketId:
    0x10b2d9edc87a5b62f8a6ac3a274b248e7219060d594617c41147c1ef116faee3
  `,
    schema: GetMarketInfoSchema,
  })
  async fetchMarketState(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetMarketStatesSchema>
  ): Promise<string> {
    try {
      const response = await fetchMarketStateFromContract(walletProvider, args);

      return wrapAndStringify(
        "morpho.read_action.fetch_market_state",
        [
          `Market Position Info for ID: ${args.marketId} \n`,
          `--------------------------------`,
          `• Total Supply Assets:        ${response.totalSupplyAssets}`,
          `• Total Supply Shares:        ${response.totalSupplyShares}`,
          `• Total Borrow Assets:        ${response.totalBorrowAssets}`,
          `• Total Borrow Shares:        ${response.totalBorrowShares}`,
          `• Last Update:               ${response.lastUpdate}`,
          `• Fee:                      ${response.fee}`,
        ].join("\n")
      );
    } catch (error) {
      throw handleError("Error fetching Morpho Vault Information", error);
    }
  }

  supportsNetwork = (network: Network) => {
    return (
      network.protocolFamily === "evm" &&
      MORPHO_SUPPORTED_PROTOCOL.includes(network.networkId!)
    );
  };
}

export const morphoReadActionProvider = () => new MorphoReadActionProvider();
