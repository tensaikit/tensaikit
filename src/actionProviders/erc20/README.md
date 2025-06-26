# Wallet Action Provider

This directory contains the **ERC20ActionProvider** implementation, which provides actions for interacting with ERC20 tokens across EVM-compatible blockchain networks. It supports querying token balances and transferring ERC20 assets.

## Directory Structure

```
wallet/
├── erc20ActionProvider.ts          # ERC20 provider implementation with balance and transfer actions
├── schemas.ts                      # Zod schemas for validating ERC20 action inputs
├── index.ts                        # Module entry point and exports
└── README.md                       # This file
```

## Actions

- `get_balance`: Fetches the ERC20 token balance for the connected wallet

- `transfer`: Transfers a specified amount of ERC20 tokens to another address

## Network Support

The wallet provider is blockchain-agnostic.
