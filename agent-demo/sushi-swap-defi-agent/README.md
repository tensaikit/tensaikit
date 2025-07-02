# Tensaikit LangChain Examples - Chatbot Typescript

This example demonstrates a terminal-style chatbot agent powered by TensaiKit, LangChain, and onchain capabilities such as token transfers, swaps, and wallet inspection.

The agent can operate in two modes:

- Interactive Chat Mode – You provide prompts, the agent responds and acts.
- Autonomous Mode – The agent thinks and acts creatively onchain in a loop.

## What Can This Chatbot Do?

Ask the chatbot to interact with Web3 on your behalf. Example prompts:

- "What’s my wallet address and balance?"
- "Swap 0.01 ETH to 0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC AUSD using SushiSwap"
- "Transfer 0.01 ETH to 0xabc..."
- "Get price of 0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC AUSD and quote to swap from native token to it"

## Prerequisites

### Node.js 18+

Ensure Node.js version 18 or higher is installed:

```bash
node --version
```

If you don't have the correct version, you can install it using [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install node
nvm use node
```

### API Keys

You’ll need the following keys:

- [OpenAI API Key](https://platform.openai.com/docs/quickstart#create-and-export-an-api-key)
- Wallet Private Key – A testnet (Katana) wallet is recommended
- KATANA_RPC_API_KEY – Your RPC URL for Katana if custom

Rename `.env-local` to `.env` and set:

```
OPENAI_API_KEY=your_openai_api_key_here
WALLET_PRIVATE_KEY=your_wallet_private_key_here

KATANA_RPC_API_KEY=your_katana_rpc_api_key
NETWORK_ID="katana-network"
CHAIN_ID="129399"
```

## Running the example

From the examples directory:

```bash
cd examples/langchain-sushi-chatbot
npm install
npm start
```

You'll be prompted to select a mode:

```
Available modes:
1. chat    - Interactive chat mode
2. auto    - Autonomous action mode
```

Choose chat to talk directly with the agent, or auto to let the agent take creative onchain actions by itself (e.g., checking balances, fetching SushiSwap quotes, and trying token swaps).

## Features Used

- LangChain’s createReactAgent
- TensaiKit with action providers:
  - walletActionProvider (wallet/network/balance)
  - erc20ActionProvider (balances, transfers)
  - sushiSwapActionProvider (price fetch, token quotes and swap)
- Custom streaming response handling
- Environment validation and flexible CLI
- Chat and Autonomous modes
