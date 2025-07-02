import { defineChain } from "viem";

/**
 * Returns a Katana chain definition compatible with viem's client setup.
 *
 * @returns A `Chain` object for the Katana Network.
 */
export const katana = () =>
  /*#__PURE__*/ defineChain({
    id: 747474,
    name: "Katana",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: {
        http: [`https://rpc.katana.network/`],
      },
    },
    blockExplorers: {
      default: {
        name: "Katana Explorer",
        url: "https://explorer.katanarpc.com/",
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
