import { z } from "zod";
import { CreateAction } from "../actionDecorator";
import { ActionProvider } from "../actionProvider";
import { EvmWalletProvider } from "../../walletProviders";
import { Network } from "../../network";
import { MORPHO_SUPPORTED_SUB_GRAPH } from "./utils";
import {
  ActiveMarketsQuerySchema,
  CuratorsQuerySchema,
  MarketStateByUniqueKeySchema,
  UserDataQuerySchema,
  WhitelistedVaultsQuerySchema,
} from "./schemas";
import { handleError } from "../../common/errors";
import { wrapAndStringify } from "../../common/utils";
import { fetchWhitelistedMarkets } from "./logic/fetchWhitelistedMarkets";
import { fetchWhitelistedVaults } from "./logic/fetchWhitelistedVaults";
import { fetchMarketStateByUniqueKey } from "./logic/fetchMarketStateByUniqueKey";
import { fetchUserDataByAddress } from "./logic/fetchUserDataByAddress";
import { fetchCurators } from "./logic/fetchCurators";

/**
 * Provides subgraph-based read-only actions for Morpho Blue protocol.
 * Includes interest rates, active markets, and account-level data queries.
 */
export class MorphoSubgraphActionProvider extends ActionProvider<EvmWalletProvider> {
  /**
   * Initializes the Morpho Subgraph Action Provider
   */
  constructor() {
    super("morpho.subgraph", []);
  }

  /**
   * Retrieves a list of active (whitelisted) Morpho Blue markets with configuration and state metrics.
   *
   * This function queries the Morpho subgraph to return market entries that are whitelisted,
   * including supply/borrow APYs, token details, oracle and interest rate model configuration,
   * utilization, collateral stats, and overall TVL.
   *
   * Useful for building dashboards or letting users explore markets available for lending/borrowing.
   *
   * @param walletProvider - Instance of EVM-compatible wallet provider.
   * @param args - Pagination input including:
   *   - `skip`: Number of items to skip.
   *   - `first`: Number of items to fetch (max 100).
   *
   * @returns A Promise resolving to a JSON string of active Morpho Blue markets.
   *
   * @throws Will throw an error if:
   *  - The network is not supported or is invalid.
   *  - The subgraph query fails or returns an invalid result.
   */
  @CreateAction({
    name: "get_active_markets",
    description: `
    This action fetches active (whitelisted) Morpho Blue markets along with configuration and performance metrics.

    Inputs:
    - skip: Number of entries to skip for pagination.
    - first: Number of entries to fetch (max 100).

    Each market entry includes:
    - Token metadata (loan/collateral)
    - Oracle and interest rate model configuration
    - Max LTV, supply and borrow rates
    - Utilization metrics, TVL, and APR rewards
  `,
    schema: ActiveMarketsQuerySchema,
  })
  async getActiveMarkets(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof ActiveMarketsQuerySchema>
  ): Promise<string> {
    try {
      const response = await fetchWhitelistedMarkets(walletProvider, args);
      return wrapAndStringify("morpho.subgraph.get_active_markets", response);
    } catch (error) {
      throw handleError("Error fetching Morpho markets", error);
    }
  }

  /**
   * Retrieves all whitelisted vaults available on the Morpho Blue protocol for the current network.
   *
   * Each vault contains metadata (name, symbol, creator), performance data (APY, total assets), and reward info.
   * Useful for users selecting yield strategies or analyzing vaults curated by the protocol.
   *
   * @param walletProvider - Instance of EVM-compatible wallet provider.
   * @param args - Pagination input including:
   *   - `skip`: Number of items to skip.
   *   - `first`: Number of items to fetch (max 100).
   *
   * @returns A Promise resolving to a JSON string array of whitelisted vaults.
   *
   * @throws Will throw if the network is unsupported or the query fails.
   */
  @CreateAction({
    name: "get_whitelisted_vaults",
    description: `
    This action fetches whitelisted vaults from the Morpho Blue subgraph for the current chain.

    Inputs:
    - skip: Number of entries to skip for pagination.
    - first: Number of entries to fetch (max 100).

    Each vault includes:
    - Vault metadata (name, creator, image)
    - Total assets, APY, rewards info
    - Whitelist and verification status
  `,
    schema: WhitelistedVaultsQuerySchema,
  })
  async getWhitelistedVaults(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof WhitelistedVaultsQuerySchema>
  ): Promise<string> {
    try {
      const response = await fetchWhitelistedVaults(walletProvider, args);
      return wrapAndStringify(
        "morpho.subgraph.get_whitelisted_vaults",
        response
      );
    } catch (error) {
      throw handleError("Error fetching Morpho vaults", error);
    }
  }

  /**
   * Fetches the current state of a specific Morpho Blue market using its unique key.
   *
   * This action returns on-chain metrics such as TVL, supply/borrow amounts, liquidity,
   * and performance rates (APY, APR). Useful for tracking market health and performance.
   *
   * @param walletProvider - Connected EVM-compatible wallet provider.
   * @param args - Includes a valid `uniqueKey` and `chainId` to identify the market.
   *
   * @returns A Promise resolving to a JSON string of market state details.
   *
   * @throws If the network is not supported or subgraph query fails.
   */
  @CreateAction({
    name: "get_market_state_by_unique_key",
    description: `
    Fetches detailed state information of a Morpho Blue market using its unique key.

    Inputs:
    - uniqueKey: Unique identifier of the market (hex string)
    - chainId: Chain ID of the network (e.g., 137, 8453)

    The response includes:
    - Collateral, borrow, supply, and liquidity values (raw + USD)
    - Historical and daily APYs
    - Reward rates (APR)
  `,
    schema: MarketStateByUniqueKeySchema,
  })
  async getMarketStateByUniqueKey(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof MarketStateByUniqueKeySchema>
  ): Promise<string> {
    try {
      const response = await fetchMarketStateByUniqueKey(walletProvider, args);
      return wrapAndStringify(
        "morpho.subgraph.get_market_state_by_unique_key",
        response
      );
    } catch (error) {
      throw handleError("Error fetching market state by unique key", error);
    }
  }

  /**
   * Retrieves complete portfolio data for the connected wallet in Morpho Blue protocol.
   *
   * This includes vault and market positions (with PnL, balances, and USD values), and recent transactions.
   * Ideal for building user dashboards or financial summaries.
   *
   * @param walletProvider - Connected EVM-compatible wallet provider.
   *
   * @returns A Promise resolving to a JSON string of the user's positions and activity.
   *
   * @throws Will throw if the network is unsupported or query fails.
   */
  @CreateAction({
    name: "get_user_portfolio_data",
    description: `
    Fetches a user's full portfolio data on Morpho Blue, including vault and market positions.

    Inputs: (No manual input, wallet address is derived from provider)

    The response includes:
    - Market positions: borrow/supply/collateral + PnL
    - Vault holdings: assets, shares, USD value
    - Recent transaction history (hash, type, timestamp)
  `,
    schema: UserDataQuerySchema,
  })
  async getUserPortfolioData(
    walletProvider: EvmWalletProvider
  ): Promise<string> {
    try {
      const response = await fetchUserDataByAddress(walletProvider);
      return wrapAndStringify(
        "morpho.subgraph.get_user_portfolio_data",
        response
      );
    } catch (error) {
      throw handleError("Error fetching user portfolio data", error);
    }
  }

  /**
   * Fetches all curators registered on the Morpho Blue protocol for the connected network.
   *
   * Each curator includes metadata (name, image), AUM, and verification status.
   * Useful for filtering vaults or recommending trusted curators to users.
   *
   * @param walletProvider - Instance of EVM-compatible wallet provider.
   *
   * @returns A Promise resolving to a JSON string of curators.
   *
   * @throws If the network is unsupported or the subgraph call fails.
   */
  @CreateAction({
    name: "get_curators",
    description: `
    This action fetches all verified curators on Morpho Blue for the current chain.

    Inputs: None

    Each curator includes:
    - Name and image
    - Total AUM (Assets Under Management)
    - Verification status
  `,
    schema: CuratorsQuerySchema,
  })
  async getCurators(walletProvider: EvmWalletProvider): Promise<string> {
    try {
      const response = await fetchCurators(walletProvider);
      return wrapAndStringify("morpho.subgraph.get_curators", response);
    } catch (error) {
      throw handleError("Error fetching curators", error);
    }
  }

  supportsNetwork = (network: Network) =>
    network.protocolFamily === "evm" &&
    MORPHO_SUPPORTED_SUB_GRAPH.includes(network.networkId!);
}

export const morphoSubgraphActionProvider = () =>
  new MorphoSubgraphActionProvider();
