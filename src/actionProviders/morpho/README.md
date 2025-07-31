# Morpho Action Provider

This directory contains the **MorphoSubgraphActionProvider**, **MorphoWriteActionProvider**, and **MorphoReadActionProvider** implementations. These providers expose actions that allow querying **subgraph data** and **executing smart contract operations** for the [Morpho Blue Protocol](https://docs.morpho.org/).

## Directory Structure

```
morpho/
├── abi
│   └── morphoBlueABI.ts                        # ABI definition for the Morpho Blue smart contract
├── logic/                                      # Core logic for read/write interactions (contract + subgraph)
│   ├── fetchCurators.ts                        # Fetch curator metadata and AUM from subgraph
│   ├── fetchMarketConfigFromContract.ts        # Get decoded market config from contract via marketId
│   ├── fetchMarketStateByUniqueKey.ts          # Fetch market state from subgraph using uniqueKey
│   ├── fetchMarketStateFromContract.ts         # Read live market state (supply/borrow shares) from contract
│   ├── fetchPositionInfoFromContract.ts        # Fetch user supply/borrow/collateral shares directly from contract
│   ├── fetchUserDataByAddress.ts               # Get user vault/market positions and history via subgraph
│   ├── fetchWhitelistedMarkets.ts              # List of active/whitelisted markets with metrics
│   ├── fetchWhitelistedVaults.ts               # List of all whitelisted vaults with metadata
│   ├── writeBorrowLoan.ts                      # Borrow loan token from a Morpho market (on-chain tx)
│   ├── writeRepayLoan.ts                       # Repay borrowed loan token to a Morpho market
│   ├── writeSupplyCollateralToken.ts           # Deposit collateral into a Morpho market
│   ├── writeSupplyLoanToken.ts                 # Supply loan token to a Morpho market
│   ├── writeWithdrawCollateralToken.ts         # Withdraw previously deposited collateral
│   ├── writeWithdrawLoanToken.ts               # Withdraw supplied loan token from the market
│   └── index.ts                                # (Optional) Exports registry for logic functions
├── query/                                      # GraphQL query builders for subgraph API
│   ├── morphoAPIQuery.ts                       # Parametrized GraphQL queries for markets, vaults, users, etc.
│   └── subGraphQuery.ts                        # (Optional legacy) Static or reusable subgraph queries
├── morphoReadActionProvider.ts                 # Exposes read-only contract actions (live state)
├── morphoSubgraphActionProvider.ts             # Exposes subgraph query actions for vaults/markets/users
├── morphoWriteActionProvider.ts                # Exposes write actions (borrow, repay, supply, withdraw)
├── schemas.ts                                  # Lending,borrowing, etc action schemas
├── index.ts                                    # Main exports
├── utils.ts                                    # Common utilities
└── README.md                                   # This file
```

## Actions

### `MorphoSubgraphActionProvider` – Subgraph Read-Only Actions

These actions query indexed data from The Graph subgraph for Morpho Blue:

- `get_active_markets`: Paginated list of all whitelisted active Morpho Blue markets with full metric data.
- `get_whitelisted_vaults`: Paginated list of whitelisted vaults with metadata and performance stats.
- `get_market_state_by_unique_key`: Fetches current state data for a market using its uniqueKey.
- `get_user_portfolio_data`: Returns connected user’s full position in vaults and markets.
- `get_curators`: Returns a list of known curators with AUM, metadata, and verification status.

### `MorphoReadActionProvider` – On-Chain Read (Contract View)

These actions query smart contracts directly:

- `fetch_market_state`: Reads raw market configuration from the Morpho Blue contract.
- `fetch_market_config`: Decodes and resolves market configuration using market ID.
- `fetch_position_info`: Reads user's current borrow/supply/collateral shares from on-chain state.

---

### `MorphoWriteActionProvider` – On-Chain Transactions

These actions interact with the Morpho Blue contract and send signed transactions:

- `borrow`: Borrow loan assets from a market.
- `repay`: Repay borrowed loan tokens.
- `supply`: Supply loan tokens to the protocol.
- `withdraw`: Withdraw supplied loan tokens.
- `supply_collateral`: Deposit collateral assets to a market.
- `withdraw_collateral`: Withdraw collateral from the market.

## Network Support

The Morpho provider supports Katana.
