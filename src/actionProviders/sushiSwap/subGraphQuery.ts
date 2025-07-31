export const querySushiSwapAllTokens = (variables: {
  chainId: number;
  skip: number;
  first: number;
}) => {
  return {
    query: `query TokenList($chainId: TokenListChainId!, $first: Int, $skip: Int) {
      tokenList(chainId: $chainId, first: $first, skip: $skip) {
        address
        symbol
        name
        decimals
        approved
  }
}`,
    variables: variables,
  };
};
