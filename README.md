# Tensaikit

A TypeScript based autonomous DeFi Agent Kit on Katana network designed to enable fully autonomous AI agents to independently plan and execute financial operations.

## 📚 Documentation

- [Tensaikit Docs](https://docs.tensaikit.xyz/)

## 📦 Installation

```bash
# Install via yarn
yarn add tensaikit
# or npm
npm install tensaikit
```

## 🛠️ Action Providers

- [Alchemy Action Provider](./src/actionProviders/alchemy/README.md)
- [ERC20 Action Provider](./src/actionProviders/erc20/README.md)
- [Morpho Action Provider](./src/actionProviders/morpho/README.md)
- [SushiSwap Action Provider](./src/actionProviders/sushiSwap/README.md)
- [Wallet Action Provider](./src/actionProviders/wallet/README.md)

## 🚀 Quick Start Example

Below is a minimal example of how to use the TensaiKit SDK to create an interactive chatbot agent:

```ts
import {
  TensaiKit,
  walletActionProvider,
  erc20ActionProvider,
  alchemyTokenPricesActionProvider,
  morphoProtocolActionProvider,
  sushiSwapActionProvider,
  katana,
} from "tensaikit";
import { createWalletClient, http } from "viem";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function getMyLangChainTools(toolkit: TensaiKit) {
  const actions = toolkit.getActions();

  return actions.map((action) =>
    tool(
      async (arg) => {
        const result = await action.invoke(arg);
        return result;
      },
      {
        name: action.name,
        description: action.description,
        schema: action.schema,
      }
    )
  );
}

async function initializeAgent() {
  const account = privateKeyToAccount(
    (process.env.WALLET_PRIVATE_KEY as `0x{string}`) ?? ""
  );

  const client = createWalletClient({
    account,
    chain: katana(process.env.KATANA_RPC_API_KEY),
    transport: http(),
  });

  const walletProvider = new ViemWalletProvider(client);

  // Initialize TensaiKit
  const tensaiKit = await TensaiKit.from({
    walletProvider: walletProvider,
    actionProviders: [
      walletActionProvider(),
      erc20ActionProvider(),
      alchemyTokenPricesActionProvider(),
      morphoProtocolActionProvider(),
      sushiSwapActionProvider(),
    ],
  });

  const tools = await getMyLangChainTools(tensaiKit);

  const memory = new MemorySaver();
  const agentConfig = {
    configurable: { thread_id: "TensaiKit Chatbot Example" },
  };

  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier: `You are an intelligent and helpful onchain assistant. Use the tools provided via TensaiKit to read blockchain data, execute transactions, and guide users with accurate, secure responses.`,
  });

  return { agent, config: agentConfig };
}

initializeAgent();
```

## 🔗 More Information

- [Tensaikit Documentation](https://docs.tensaikit.xyz/)
