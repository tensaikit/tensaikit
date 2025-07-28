import z from "zod";
import { ActionProvider } from "../../actionProvider";
import { CreateAction } from "../../actionDecorator";
import { EvmWalletProvider } from "../../../walletProviders";
import { createError, ErrorCode, handleError } from "../../../common/errors";
import { Network } from "../../../network";
import { GetTokenDetailsSchema, QueryGetSushiAllTokens } from "../schemas";
import { wrapAndStringify } from "../../../common/utils";
import { fetchAllTokensFromSubgraph, fetchTokenMetadata } from "../logic";

/**
 * SushiSwapTokenActions provides utilities for retrieving token metadata and listings from SushiSwap.
 *
 * This action group focuses on token-related operations, including:
 * - Fetching metadata (name, symbol, decimals) for a specific token via SushiSwap’s pricing API
 * - Querying a paginated list of all tokens available on SushiSwap using The Graph’s subgraph
 *
 * Responsibilities:
 * - Use on-chain or indexed APIs to fetch metadata for ERC-20 tokens on supported EVM chains
 * - Support pagination and API key–secured access to the SushiSwap subgraph
 *
 * Registered under the action provider key: `sushiSwap.token`
 *
 * Note:
 * - Requires a valid `subGraphApiKey` for subgraph queries.
 * - Only EVM-compatible chains are supported.
 */
export class SushiSwapTokenActions extends ActionProvider<EvmWalletProvider> {
  private readonly subGraphApiKey: string;

  constructor(subGraphApiKey: string) {
    super("sushi_swap.token", []);
    this.subGraphApiKey = subGraphApiKey;
  }

  /**
   * Fetches metadata for a token (e.g., decimals, symbol, name) from SushiSwap's public API.
   *
   * @param walletProvider - Instance of EVM-compatible WalletProvider
   * @param args - Includes `tokenAddress` of the token to fetch metadata for
   * @returns A JSON string containing token metadata
   * @throws If the API call fails or the token is unsupported
   */
  @CreateAction({
    name: "get_token_details",
    description: `
    Retrieves metadata for a specific token on a chain.

    Inputs:
    - chainId: Chain ID of the network.
    - tokenAddress: Contract address of the token.

    Notes:
    - Ensure the token address is valid and supported by SushiSwap.
  `,
    schema: GetTokenDetailsSchema,
  })
  async getTokenDetails(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof GetTokenDetailsSchema>
  ): Promise<string> {
    try {
      const { tokenAddress } = args;
      const chainId = walletProvider.getNetwork().chainId;
      if (!chainId) {
        throw createError(
          "Invalid or missing chain ID",
          ErrorCode.INVALID_NETWORK
        );
      }
      const response = await fetchTokenMetadata(chainId, tokenAddress);
      return wrapAndStringify("sushi_swap.token.get_token_details", response);
    } catch (error) {
      throw handleError("Failed to retrieve token details", error);
    }
  }

  /**
   * Fetches a paginated list of all tokens available on SushiSwap from the subgraph for the connected EVM chain.
   *
   * @param walletProvider - Instance of EVM-compatible WalletProvider.
   * @param args - Object containing `skip` and `first` for pagination control.
   * @returns A JSON string representing the array of tokens including id, name, symbol, poolCount, and volume.
   * @throws If the connected network's chainId is missing or the subgraph query fails.
   *
   * Notes:
   * - Uses The Graph's SushiSwap subgraph endpoint.
   * - Requires a valid `subGraphApiKey` to authenticate the query request.
   * - Supports pagination using `skip` (default: 0) and `first` (default: 50).
   */
  @CreateAction({
    name: "get_all_sushi_tokens",
    description: `
      Fetches a paginated list of all tokens available on SushiSwap for the connected chain using the subgraph.

    Inputs:
    - skip: Number of tokens to skip (useful for pagination)
    - first: Number of tokens to fetch (e.g., 50)

    Note:
    - This uses The Graph's SushiSwap subgraph endpoint.
    - Make sure a valid subGraphApiKey is configured for authenticated access.
  `,
    schema: QueryGetSushiAllTokens,
  })
  async getAllSushiTokens(
    walletProvider: EvmWalletProvider,
    args: z.infer<typeof QueryGetSushiAllTokens>
  ): Promise<string> {
    try {
      const response = await fetchAllTokensFromSubgraph(walletProvider, args);
      return wrapAndStringify(
        "sushi_swap.token.get_all_sushi_tokens",
        response
      );
    } catch (error) {
      throw handleError("Failed to fetch all tokens", error);
    }
  }

  supportsNetwork = (network: Network) => network.protocolFamily === "evm";
}
