# Wallet Action Provider

This directory contains the **SushiSwapActionProvider** implementation, DEX functionality for token prices, liquidity data, and token swaps.

## Directory Structure

```
wallet/
├── actions
│   ├── index.ts                    # Aggregated export for SushiSwap actions
│   ├── liquidity.ts                # SushiSwap liquidity-related actions
│   ├── price.ts                    # SushiSwap token price and metadata actions
│   └── swap.ts                     # SushiSwap swap & transaction actions
├── schemas.ts                      # zod schemas for validating action input
├── sushiSwapActionProvider.ts      # Main provider for all SushiSwap actions
├── utils.ts                        # Shared utilities (API endpoints, Sushi SDK, helpers)
├── index.ts                        # Main exports
└── README.md                       # This file
```

## Actions

- `get_liquidity_providers`: Lists SushiSwap liquidity providers on a given chain

- `get_token_price`: Returns the USD price of a token on a specific chain.

- `get_all_token_prices`: Returns USD prices for all tokens on a specific chain.

- `get_token_details`: Fetches metadata of a token (name, symbol, decimals).

- `getSwapQuote`: Generates a quote for swapping two tokens.

- `executeSwap`: Executes a token swap on SushiSwap (with auto-approval if needed).

## Network Support

The wallet provider is blockchain-agnostic.
