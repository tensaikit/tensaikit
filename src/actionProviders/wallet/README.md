# Wallet Action Provider

This directory contains the **WalletActionProvider** implementation, which provides actions for basic wallet operations and information retrieval across multiple blockchain networks.

## Directory Structure

```
wallet/
├── walletActionProvider.ts         # Main provider with wallet functionality
├── schemas.ts                      # Wallet action schemas
├── index.ts                        # Main exports
└── README.md                       # This file
```

## Actions

- `get_wallet_details`: Get wallet information

  - Returns wallet address
  - Includes native token balance
  - Network info: protocol family, chain ID, network ID
  - Wallet provider name

- `native_transfer`: Transfer native tokens in ETH to another address

## Network Support

The wallet provider is blockchain-agnostic.
