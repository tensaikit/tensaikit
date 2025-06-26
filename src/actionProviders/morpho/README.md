# Morpho Action Provider

This directory contains the **MorphoSubgraphActionProvider** and **MorphoProtocolActionProvider** implementations. These providers expose actions that allow querying subgraph data and interacting with the Morpho Blue smart contract directly.

## Directory Structure

```
morpho/
├── abi
│   ├── morphoBlueABI.ts
├── morphoProtocolActionProvider.ts         # Handles supply, withdraw, borrow, repay, collateral interactions
├── morphoSubgraphActionProvider.ts         # Handles subgraph queries (markets, interest rates, account data)
├── schemas.ts                              # Lending/borrowing action schemas
├── subGraphQuery.ts                        # GraphQL query definitions for subgraph
├── index.ts                                # Main exports
├── utils.ts                                # Common utilities
└── README.md                               # This file
```

## Actions

### Protocol Actions (MorphoProtocolActionProvider)

- `query_account`: Fetches user account positions and activity.
- `get_lender_interest_rates`: Fetches current lending interest rates.
- `get_borrower_interest_rates`: Fetches current borrowing interest rates.
- `get_active_markets`: Lists active Morpho Blue markets with stats.

### Subgraph Actions (MorphoSubgraphActionProvider)

- `supply`: Supplies loanToken to a Morpho market.
- `withdraw`: Withdraws loanToken from a Morpho market.
- `supply_collateral`: Supplies collateralToken to a Morpho market.
- `withdraw_collateral`: Withdraws collateralToken from a Morpho market.
- `borrow`: Borrows loanToken from a Morpho market.
- `repay`: Repays loanToken debt to a Morpho market.

## Network Support

The Morpho provider supports Katana and Polygon POS.

## Notes

For more information on the **Morpho Protocol**, visit [Morpho Documentation](https://docs.morpho.org/).
