import { fetchFromApi } from "./fetchFromApi";

export const makeSubgraphQueryCall = async (
  subgraphURL: string,
  subgraphQuery: { query: string; variables?: Record<string, any> },
  apiKey?: string
) => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetchFromApi<any>(subgraphURL, {
      method: "POST",
      headers,
      body: subgraphQuery,
    });

    if (response?.data) {
      return response.data;
    } else {
      return null;
    }
  } catch (error: any) {
    throw new Error(`Subgraph query failed ${subgraphURL}: ${error.message}`);
  }
};
