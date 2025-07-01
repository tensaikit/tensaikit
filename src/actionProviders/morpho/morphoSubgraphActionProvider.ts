import { z } from "zod";
import { CreateAction } from "../actionDecorator";
import { ActionProvider } from "../actionProvider";
import { EvmWalletProvider } from "../../walletProviders";
import { Network } from "../../network";
import { MORPHO_SUPPORTED_SUB_GRAPH, subGraphUrlByChainId } from "./utils";
import {
  ActiveMarketsQuerySchema,
  BorrowerInterestRateSchema,
  LenderInterestRateSchema,
  QueryAccountSchema,
} from "./schemas";
import { createError, ErrorCode, handleError } from "../../common/errors";
import { makeSubgraphQueryCall } from "../../common/utils/makeSubgraphQueryCall";
import {
  queryAccountById,
  queryInterestRates,
  queryLenderInterestRates,
  queryMarkets,
} from "./subGraphQuery";
import { wrapAndStringify } from "../../common/utils";

/**
 * Configuration options for initializing the MorphoSubgraphActionProvider.
 */
export interface MorphoActionProviderConfig {
  // Subgraph API key (required for queries)
  subGraphApiKey?: string;
}

/**
 * Provides subgraph-based read-only actions for Morpho Blue protocol.
 * Includes interest rates, active markets, and account-level data queries.
 */
export class MorphoSubgraphActionProvider extends ActionProvider<EvmWalletProvider> {
  private readonly subGraphApiKey: string;

  /**
   * Initializes the Morpho Subgraph Action Provider
   *
   * @param config - Configuration containing subgraph API key
   */
  constructor(config: MorphoActionProviderConfig = {}) {
    super("morpho.subgraph", []);

    config.subGraphApiKey ||= process.env.SUBGRAPH_API_KEY || "";
    if (!config.subGraphApiKey) {
      throw new Error("SUBGRAPH_API_KEY is not configured.");
    }
    this.subGraphApiKey = config.subGraphApiKey;
  }

  /**
   * Fetches account-level activity and position data from the Morpho Blue subgraph.
   *
   * @param walletProvider - Instance of EVM-compatible WalletProvider
   * @param args - Includes `account` (Ethereum address), `skip`, and `first` for pagination
   * @returns A JSON string containing user activity and position breakdown
   * @throws If the network is invalid or subgraph call fails
   */
  @CreateAction({
    name: "query_account",
    description: `
    This action retrieves account-level data from the Morpho Blue subgraph.

    Inputs:
    - account: Ethereum address of the user (lowercase, checksummed not required)
    - skip: Number of records to skip (used for pagination).
    - first: Number of records to fetch (max 100).

    This includes:
    - Counts of deposits, borrows, repays, withdrawals, positions
    - Detailed info about positions
  `,
    schema: QueryAccountSchema,
  })
  async queryAccount(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof QueryAccountSchema>
  ): Promise<string> {
    try {
      const network = walletProvider.getNetwork();
      const chainId = network.chainId;
      if (!chainId) {
        throw createError(
          "Invalid or missing network",
          ErrorCode.INVALID_NETWORK
        );
      }

      const subGraphUrl = subGraphUrlByChainId(Number(chainId));
      const response = await makeSubgraphQueryCall(
        subGraphUrl,
        queryAccountById(args.account, args.first, args.skip),
        this.subGraphApiKey
      );

      if (!response || !response.account) {
        return wrapAndStringify(
          "morpho.subgraph.query_account",
          `No data found for account: ${args.account}`
        );
      }

      return wrapAndStringify(
        "morpho.subgraph.query_account",
        response.account
      );
    } catch (error) {
      throw handleError("Error fetching Morpho account", error);
    }
  }

  /**
   * Fetches the current interest rates offered to lenders across Morpho Blue markets.
   *
   * @param walletProvider - Instance of EVM-compatible WalletProvider
   * @param args - Includes `skip` and `first` to control pagination
   * @returns A JSON string array of lender interest rate entries
   * @throws If the network is invalid or subgraph query fails
   */
  @CreateAction({
    name: "get_lender_interest_rates",
    description: `
    This action fetches the current interest rates offered to lenders 
    in Morpho Blue markets. The rates are sorted by the market's 
    total value locked (TVL) in descending order.

    Inputs:
    - skip: Number of records to skip (used for pagination).
    - first: Number of records to fetch (max 100).

    The results include:
    - id: Unique interest rate record ID
    - rate: Interest rate offered to lenders
    - side: Should always be 'LENDER'
  `,
    schema: LenderInterestRateSchema,
  })
  async getLenderInterestRates(
    walletProvider: any,
    args: z.infer<typeof LenderInterestRateSchema>
  ): Promise<string> {
    try {
      const network = walletProvider.getNetwork();
      const chainId = network.chainId;
      if (!chainId) {
        throw createError(
          "Invalid or missing network",
          ErrorCode.INVALID_NETWORK
        );
      }

      const subGraphUrl = subGraphUrlByChainId(Number(chainId));
      const response = await makeSubgraphQueryCall(
        subGraphUrl,
        queryLenderInterestRates({ first: args.first, skip: args.skip }),
        this.subGraphApiKey
      );

      if (!response || !response.interestRates) {
        return wrapAndStringify(
          "morpho.subgraph.get_lender_interest_rates",
          "No data found!"
        );
      }

      return wrapAndStringify(
        "morpho.subgraph.get_lender_interest_rates",
        response.interestRates
      );
    } catch (error) {
      throw handleError("Error fetching Morpho account", error);
    }
  }

  /**
   * Fetches the current borrowing interest rates across Morpho Blue markets.
   *
   * @param walletProvider - Instance of EVM-compatible WalletProvider
   * @param args - Includes `skip` and `first` to control pagination
   * @returns A JSON string array of borrower interest rate entries
   * @throws If the network is invalid or subgraph query fails
   */
  @CreateAction({
    name: "get_borrower_interest_rates",
    description: `
    This action fetches the current interest rates paid by borrowers 
    in Morpho Blue markets. The rates are sorted by the market's 
    total value locked (TVL) in descending order.

    Inputs:
    - skip: Number of records to skip (for pagination)
    - first: Number of records to fetch (max 100)

    Each result includes:
    - id: Unique rate record ID
    - rate: Borrowing interest rate
    - side: Should always be 'BORROWER'
  `,
    schema: BorrowerInterestRateSchema,
  })
  async getBorrowerInterestRates(
    walletProvider: any,
    args: z.infer<typeof BorrowerInterestRateSchema>
  ): Promise<string> {
    try {
      const network = walletProvider.getNetwork();
      const chainId = network.chainId;
      if (!chainId) {
        throw createError(
          "Invalid or missing network",
          ErrorCode.INVALID_NETWORK
        );
      }

      const subGraphUrl = subGraphUrlByChainId(Number(chainId));
      const response = await makeSubgraphQueryCall(
        subGraphUrl,
        queryInterestRates({ first: args.first, skip: args.skip }),
        this.subGraphApiKey
      );

      if (!response || !response.interestRates) {
        return wrapAndStringify(
          "morpho.subgraph.get_borrower_interest_rates",
          "No data found!"
        );
      }

      return wrapAndStringify(
        "morpho.subgraph.get_borrower_interest_rates",
        response.interestRates
      );
    } catch (error) {
      throw handleError("Error fetching Morpho account", error);
    }
  }

  /**
   * Fetches active markets listed on the Morpho Blue protocol with detailed statistics.
   *
   * @param walletProvider - Instance of EVM-compatible WalletProvider
   * @param args - Includes `skip` and `first` to control pagination
   * @returns A JSON string array of active Morpho markets with config and metric data
   * @throws If the network is invalid or subgraph call fails
   */
  @CreateAction({
    name: "get_active_markets",
    description: `
    This action fetches active Morpho Blue markets with detailed statistics and configuration.

    Inputs:
    - skip: Number of entries to skip for pagination.
    - first: Number of entries to fetch (up to 1000).

    Each market entry includes:
    - token info, oracle, rates, protocol, interest model, utilization metrics, and TVL
  `,
    schema: ActiveMarketsQuerySchema,
  })
  async getActiveMarkets(
    walletProvider: any,
    args: z.infer<typeof ActiveMarketsQuerySchema>
  ): Promise<string> {
    try {
      const network = walletProvider.getNetwork();
      const chainId = network.chainId;
      if (!chainId) {
        throw createError(
          "Invalid or missing network",
          ErrorCode.INVALID_NETWORK
        );
      }

      const subGraphUrl = subGraphUrlByChainId(Number(chainId));
      const response = await makeSubgraphQueryCall(
        subGraphUrl,
        queryMarkets({ first: args.first, skip: args.skip }),
        this.subGraphApiKey
      );

      if (!response || !response.markets) {
        return wrapAndStringify(
          "morpho.subgraph.get_active_markets",
          "No data found!"
        );
      }

      return wrapAndStringify(
        "morpho.subgraph.get_active_markets",
        response.markets
      );
    } catch (error) {
      throw handleError("Error fetching Morpho markets", error);
    }
  }

  supportsNetwork = (network: Network) =>
    network.protocolFamily === "evm" &&
    MORPHO_SUPPORTED_SUB_GRAPH.includes(network.networkId!);
}

export const morphoSubgraphActionProvider = () =>
  new MorphoSubgraphActionProvider();
