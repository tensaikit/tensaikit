# Sushi Action Provider

This directory contains the **SushiSwapActionProvider** and **SushiSwapExecuteOnlyActionProvider** implementation, DEX functionality for token prices, liquidity data, and token swaps.

## Directory Structure

```
sushiSwap/
├── actions
│   ├── index.ts                        # Aggregated export for SushiSwap actions
│   ├── liquidity.ts                    # SushiSwap liquidity-related actions
│   ├── price.ts                        # SushiSwap token price actions
│   ├── swapQuote.ts                    # SushiSwap swap quote action
│   └── token.ts                        # SushiSwap metadata and token list actions
├── logic
│   ├── fetchAllTokenPrices.ts           // Fetches USD prices for all tokens on a given EVM chain
│   ├── fetchAllTokensFromSubgraph.ts    // Queries SushiSwap subgraph for a paginated list of tokens
│   ├── fetchLiquidityProviders.ts       // Retrieves a list of liquidity providers for a specific chain
│   ├── fetchSwapQuote.ts                // Generates a swap quote for a given token pair and amount
│   ├── fetchTokenMetadata.ts            // Fetches metadata (symbol, decimals, etc.) for a specific token
│   ├── fetchTokenPrice.ts               // Fetches the USD price of a single token
│   ├── prepareAndSendSwapTransaction.ts // Prepares, simulates, and sends a SushiSwap token swap transaction
│   └── index.ts                        # Aggregated export for SushiSwap logics
├── schemas.ts                          # zod schemas for validating action input
├── sushiSwapActionProvider.ts          # Main provider for all SushiSwap actions
├── sushiSwapExecuteActionProvider.ts   # Minimal provider for swap execution only
├── subGraphQuery.ts                    # GraphQL queries for SushiSwap subgraph
├── utils.ts                            # Shared utilities (API endpoints, Sushi SDK, helpers)
├── index.ts                            # Main exports
└── README.md                           # This file
```

## Actions for SushiSwapActionProvider

- `get_liquidity_providers`: Lists SushiSwap liquidity providers on a given chain

- `get_token_price`: Returns the USD price of a token on a specific chain.

- `get_all_token_prices`: Returns USD prices for all tokens on a specific chain.

- `get_token_details`: Fetches metadata of a token (name, symbol, decimals).

- `get_swap_quote`: Generates a quote for swapping two tokens.

- `get_all_sushi_tokens`: Fetches paginated token list from SushiSwap subgraph

## Actions for SushiSwapActionProvider

- `execute_swap`: Executes a token swap on SushiSwap (with auto-approval if needed).

## Network Support

The Sushi Swap Provider supports Katana.

## Environment Variables

To query tokens from the subgraph, a `SUBGRAPH_API_KEY` is required.  
This can be provided via `.env` or passed directly into `SushiSwapActionProvider`.

```env
SUBGRAPH_API_KEY=your-api-key
```
