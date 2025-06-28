import { z } from "zod";
import { ActionProvider } from "../actionProvider";
import { CreateAction } from "../actionDecorator";
import { AlchemyTokenPricesBySymbolSchema } from "./schemas";

/**
 * Configuration options for initializing the AlchemyTokenPricesActionProvider.
 */
export interface AlchemyTokenPricesActionProviderConfig {
  /**
   * Alchemy API Key used for authenticating requests to the Alchemy Prices API.
   */
  apiKey?: string;
}

/**
 * AlchemyTokenPricesActionProvider enables fetching real-time token price data
 * using the Alchemy Prices API, supporting lookups by token symbol or address.
 */
export class AlchemyTokenPricesActionProvider extends ActionProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Creates a new AlchemyTokenPricesActionProvider instance.
   *
   * @param config - Configuration including the Alchemy API key. Falls back to environment variable.
   * @throws If no valid API key is provided via config or environment.
   */
  constructor(config: AlchemyTokenPricesActionProviderConfig = {}) {
    super("alchemyTokenPrices", []);

    config.apiKey ||= process.env.ALCHEMY_API_KEY || "";
    if (!config.apiKey) {
      throw new Error("ALCHEMY_API_KEY is not configured.");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = "https://api.g.alchemy.com/prices/v1";
  }

  /**
   * Fetches current prices for one or more tokens based on their symbols.
   *
   * @remarks
   * This uses Alchemy’s `tokens/by-symbol` GET endpoint and allows multiple symbols per request.
   *
   * @param args - Object containing an array of token symbols (e.g., ["ETH", "USDC"]).
   * @returns A formatted JSON string with price information or error details.
   */
  @CreateAction({
    name: "token_prices_by_symbol",
    description: `
	This tool will fetch current prices for one or more tokens using their symbols via the Alchemy Prices API.

	A successful response will return a JSON payload similar to:
	{
	"data": [
		{
		"symbol": "ETH",
		"prices": [
			{
			"currency": "usd",
			"value": "2873.490923459",
			"lastUpdatedAt": "2025-02-03T23:46:40Z"
			}
		]
		}
	]
	}

	A failure response will return an error message with details.
    `,
    schema: AlchemyTokenPricesBySymbolSchema,
  })
  async tokenPricesBySymbol(
    args: z.infer<typeof AlchemyTokenPricesBySymbolSchema>
  ): Promise<string> {
    try {
      const params = new URLSearchParams();
      for (const symbol of args.symbols) {
        params.append("symbols", symbol);
      }

      const url = `${this.baseUrl}/${
        this.apiKey
      }/tokens/by-symbol?${params.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return `Successfully fetched token prices by symbol:\n${JSON.stringify(
        data,
        null,
        2
      )}`;
    } catch (error) {
      return `Error fetching token prices by symbol: ${error}`;
    }
  }

  supportsNetwork = (): boolean => {
    return true;
  };
}

/**
 * Factory function to instantiate AlchemyTokenPricesActionProvider.
 *
 * @param config - Optional configuration object containing the Alchemy API key.
 * @returns A new initialized provider instance.
 */
export const alchemyTokenPricesActionProvider = (
  config?: AlchemyTokenPricesActionProviderConfig
) => new AlchemyTokenPricesActionProvider(config);
