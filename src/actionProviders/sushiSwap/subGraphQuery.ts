export const querySushiSwapAllTokens = (variables: {
  skip: number;
  first: number;
}) => {
  return {
    query: `query tokens($skip: Int!, $first: Int!) {
      tokens(
        skip: $skip
        first: $first
      ) {
        id
        name
        symbol
        decimals
        poolCount
        volume
      }
    }`,
    variables: variables,
  };
};
