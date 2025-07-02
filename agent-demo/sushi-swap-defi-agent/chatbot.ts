import {
  TensaiKit,
  walletActionProvider,
  ViemWalletProvider,
  erc20ActionProvider,
  sushiSwapActionProvider,
  katanaTestnet,
} from "tensaikit";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { tool } from "@langchain/core/tools";

dotenv.config();

/**
 * Validates that all required environment variables are set.
 *
 * Throws an error and exits the process if any required variables are missing.
 * Logs a warning if optional variables are unset.
 *
 * Required:
 * - OPENAI_API_KEY
 * - WALLET_PRIVATE_KEY
 * - KATANA_RPC_API_KEY
 *
 * Optional:
 * - NETWORK_ID (defaults to Katana testnet if not provided)
 *
 * @returns {void}
 */
const validateEnvironment = (): void => {
  const missingVars: string[] = [];

  // Check required variables
  const requiredVars = [
    "OPENAI_API_KEY",
    "WALLET_PRIVATE_KEY",
    "KATANA_RPC_API_KEY",
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to katana-network");
  }
};

// Validate required environment variables before running any logic
validateEnvironment();

/**
 * Maps agent actions to LangChain-compatible tools.
 *
 * This function transforms the actions provided by the tensaikit into LangChain tools,
 * wrapping each action's invocation with proper async handling and metadata.
 *
 * @param {TensaiKit} toolkit - The initialized agent toolkit with available actions
 * @returns {Promise<Tool[]>} An array of LangChain tool definitions
 */
const getMyLangChainTools = async (toolkit: TensaiKit) => {
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
};

/**
 * Initializes a LangChain agent integrated with TensaiKit and onchain capabilities.
 *
 * @returns {Promise<{ agent: AgentInstance, config: object }>} Initialized agent and its configuration
 * @throws Will throw an error if any initialization step fails
 */
const initializeAgent = async () => {
  try {
    // Initialize the LLM (OpenAI gpt-4o-mini)
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create account from private key
    const account = privateKeyToAccount(
      (process.env.WALLET_PRIVATE_KEY as `0x{string}`) ?? ""
    );

    // Set up Wallet Client using Katana network
    const client = createWalletClient({
      account,
      chain: katanaTestnet(process.env.KATANA_RPC_API_KEY),
      transport: http(),
    });

    const walletProvider = new ViemWalletProvider(client);

    // Initialize TensaiKit with onchain action providers
    const tensaiKit = await TensaiKit.from({
      walletProvider: walletProvider,
      actionProviders: [
        walletActionProvider(),
        erc20ActionProvider(),
        sushiSwapActionProvider(),
      ],
    });

    // Convert available actions to LangChain tools
    const tools = await getMyLangChainTools(tensaiKit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();

    // Define custom config (used for display/debugging purposes)
    const agentConfig = {
      configurable: { thread_id: "TensaiKit Chatbot Example" },
    };

    // Create React Agent using the LLM and TensaiKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
        You are a helpful onchain agent powered by TensaiKit and its available tools. Before performing any actions,
        check the wallet details to determine the connected network. If you encounter a 5XX (internal) HTTP error,
        inform the user and suggest trying again later. If a user requests something beyond your current toolset,
        clearly explain the limitation and encourage them to build it using the TensaiKit SDK.
        Refer them to the documentation at docs.tensaikit.com. Be concise, helpful, and action-oriented in your responses.
        Do not repeat tool descriptions unless explicitly asked.
        `,
    });

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("❌ Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
};

/**
 * Runs the agent in autonomous mode, prompting it to take creative onchain actions.
 *
 * The function streams agent outputs and logs them to the console.
 * It pauses for a specified interval between each interaction.
 *
 * @param {any} agent - The initialized LangChain agent with tools
 * @param {any} config - Configuration object (e.g., thread ID, memory)
 * @param {number} interval - Delay (in seconds) between agent runs (default: 10)
 */
const runAutonomousMode = async (agent: any, config: any, interval = 10) => {
  console.log("Starting autonomous mode...");

  while (true) {
    try {
      const thought =
        "Be creative and do something interesting on the blockchain. " +
        "Start by checking the wallet balance and network details. " +
        "Then, fetch the current prices for tokens using SushiSwap. " +
        "Get a quote to swap a small amount of the native token (e.g., 0.01 ETH) to 0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC or another stable/token if AUSD is unavailable. " +
        "Finally, execute one or more of these actions to demonstrate your onchain capabilities.";

      const stream = await agent.stream(
        { messages: [new HumanMessage(thought)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  }
};

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
const runChatMode = async (agent: any, config: any) => {
  console.log("💬 Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Helper to wrap readline's question in a Promise
  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  try {
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream(
        { messages: [new HumanMessage(userInput)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
};

/**
 * Prompts the user to choose between interactive chat mode and autonomous mode.
 *
 * @returns {Promise<"chat" | "auto">} The selected mode
 */
const chooseMode = async (): Promise<"chat" | "auto"> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  while (true) {
    console.log("\n📌 Available modes:");
    console.log("1. chat    - Interactive chat mode");
    console.log("2. auto    - Autonomous action mode");

    const choice = (await question("\n👉 Choose a mode (1/chat or 2/auto): "))
      .toLowerCase()
      .trim();

    if (choice === "1" || choice === "chat") {
      rl.close();
      return "chat";
    } else if (choice === "2" || choice === "auto") {
      rl.close();
      return "auto";
    }
    console.log("❌ Invalid choice. Please enter 1, 2, 'chat', or 'auto'.");
  }
};

/**
 * Entry point for running the agent CLI.
 * Initializes the agent, prompts for mode, and starts the selected mode.
 */
async function main() {
  try {
    const { agent, config } = await initializeAgent();
    const mode = await chooseMode();

    if (mode === "chat") {
      await runChatMode(agent, config);
    } else {
      await runAutonomousMode(agent, config);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("Starting Agent...");
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
