# Alchemy Action Provider

This directory contains the **AlchemyTokenPricesActionProvider** implementation, which provides actions to interact with **Alchemy's Token API** for retrieving token prices.

## Directory Structure

```
alchemy/
├── alchemyTokenPricesActionProvider.ts         # Main provider with Alchemy token price functionality
├── schemas.ts                                  # Token price action schemas
├── index.ts                                    # Main exports
└── README.md                                   # This file
```

## Actions

- `token_prices_by_symbol`: Get token prices by symbol from Alchemy

  - Returns current prices for specified tokens by symbol (e.g. ETH, BTC, etc.)
  - Supports multiple tokens in a single request
  - Returns balance in USD

## Notes

- Requires an **Alchemy API Key** for authentication. Visit the [Alchemy Dashboard](https://dashboard.alchemy.com/) to get your key.
- Rate limits apply based on your Alchemy plan
