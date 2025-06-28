/**
 * Generates a GraphQL query to fetch active Morpho markets.
 *
 * @param variables - Pagination variables including `skip` and `first`
 * @returns A query object for retrieving a list of active markets with detailed fields
 */
export const queryMarkets = (variables: { skip: number; first: number }) => {
  return {
    query: `query market($skip: Int!, $first: Int!){
        markets(orderBy:createdBlockNumber, orderDirection:asc, where:{isActive:true}, skip: $skip, first: $first){
          id
          name
          canBorrowFrom
          canUseAsCollateral
          borrowCount
          borrowingPositionCount
          borrowedToken {
            name
            symbol
          }
          closedPositionCount
          collateralPositionCount
          createdBlockNumber
          createdTimestamp
          cumulativeBorrowUSD
          cumulativeDepositUSD
          cumulativeFlashloanUSD
          cumulativeLiquidateUSD
          cumulativeProtocolSideRevenueUSD
          cumulativeTotalRevenueUSD
          cumulativeSupplySideRevenueUSD
          cumulativeTransferUSD
          cumulativeUniqueBorrowers
          cumulativeUniqueDepositors
          cumulativeUniqueFlashloaners
          cumulativeUniqueLiquidatees
          cumulativeUniqueLiquidators
          cumulativeUniqueUsers
          cumulativeUniqueTransferrers
          depositCount
          fee
          flashloanCount
          inputTokenBalance
          inputToken {
            name
            symbol
          }
          inputTokenPriceUSD
          interest
          irm
          lltv
          oracle{
            oracleAddress
          }
          protocol{
            id
            name
            network
            owner
          }
          rates{
            id
            rate
            side
            type
          }
          lendingPositionCount
          liquidationCount
          liquidationPenalty
          liquidationThreshold
          maximumLTV
          name
          openPositionCount
          positionCount
          relation
          repayCount
          reserveFactor
          reserves
          supplyIndex
          totalBorrow
          totalBorrowBalanceUSD
          totalBorrowShares
          totalDepositBalanceUSD
          totalCollateral
          totalSupply
          totalSupplyShares
          totalValueLockedUSD
          transactionCount
          transferCount
          variableBorrowedTokenBalance
          withdrawCount
        }
      }`,
    variables: variables,
  };
};

/**
 * Generates a GraphQL query to fetch borrower-side interest rates.
 *
 * @param variables - Pagination variables including `skip` and `first`
 * @returns A query object for retrieving borrower interest rate data
 */
export const queryInterestRates = (variables: {
  skip: number;
  first: number;
}) => {
  return {
    query: `query interestRates($skip: Int!, $first: Int!) {
      interestRates(
        skip: $skip
        first: $first
        where: { side: BORROWER }
        orderBy: market__totalValueLockedUSD
        orderDirection: desc
      ) {
        id
        rate
        side
      }
    }`,
    variables: variables,
  };
};

/**
 * Generates a GraphQL query to fetch lender-side interest rates.
 *
 * @param variables - Pagination variables including `skip` and `first`
 * @returns A query object for retrieving lender interest rate data
 */
export const queryLenderInterestRates = (variables: {
  skip: number;
  first: number;
}) => {
  return {
    query: `query lenderInterestRates($skip: Int!, $first: Int!) {
      interestRates(
        skip: $skip
        first: $first
        where: { side: LENDER }
        orderBy: market__totalValueLockedUSD
        orderDirection: desc
      ) {
        id
        rate
        side
      }
    }`,
    variables: variables,
  };
};

/**
 * Generates a GraphQL query to fetch detailed position and activity data for a specific user account.
 *
 * @param account - The account address (will be lowercased and trimmed)
 * @param first - Number of positions to fetch
 * @param skip - Number of positions to skip (for pagination)
 * @returns A query object for retrieving account and position data
 */
export const queryAccountById = (
  account: string,
  first: number,
  skip: number
) => {
  return {
    query: `query accounts($account: String!, $first: Int!, $skip: Int!) {
      account(id: $account) {
        id
        positionCount
        openPositionCount
        closedPositionCount
        depositCount
        withdrawCount
        borrowCount
        repayCount
        positions(first: $first, skip: $skip, orderBy: blockNumberOpened, orderDirection:desc) {
          id
          market {
            id
          }
          asset {
            id
          }
          hashClosed
          side
          type
          isCollateral
          balance
          principal
          depositCount
          withdrawCount
          borrowCount
          repayCount
          liquidationCount
          shares
          depositCollateralCount
          withdrawCollateralCount
        }
      }
    }`,
    variables: {
      account: account.trim().toLowerCase(),
      first: first,
      skip: skip,
    },
  };
};
