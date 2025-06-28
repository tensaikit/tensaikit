import { defineChain } from "viem";

/**
 * Returns a Katana chain definition compatible with viem's client setup.
 *
 * @param katanaApiKey - Optional API key for the RPC endpoint.
 * @returns A `Chain` object for the Katana Network.
 */
export const katana = (katanaApiKey: string = "") =>
  /*#__PURE__*/ defineChain({
    id: 129399,
    name: "Katana Network",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: {
        http: [`https://rpc.tatara.katanarpc.com/${katanaApiKey}`],
      },
    },
    blockExplorers: {
      default: {
        name: "Katana Explorer",
        url: "https://explorer.tatara.katana.network/",
        apiUrl: "",
      },
    },
    contracts: {
      ensRegistry: {
        address: "0x0000000000000000000000000000000000000000",
      },
      ensUniversalResolver: {
        address: "0x0000000000000000000000000000000000000000",
        blockCreated: 0,
      },
      multicall3: {
        address: "0x0000000000000000000000000000000000000000",
        blockCreated: 0,
      },
    },
  });
