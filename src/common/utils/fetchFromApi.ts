export interface FetchOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: any;
}

export const fetchFromApi = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  try {
    const { method = "GET", headers = {}, body } = options;

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      ...(method === "POST" && body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    throw new Error(`Fetch failed for ${url}: ${error.message}`);
  }
};
