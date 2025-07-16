export const queryWhitelistedMarkets = (variables: {
  skip: number;
  first: number;
  chainId: number;
}) => {
  return {
    query: `query Markets($skip: Int!, $first: Int!, $chainId: Int!){
        markets(
            first: $first,
            skip: $skip,
            where: { whitelisted: true, chainId_in: [$chainId]},
            orderBy: BorrowApy,
            orderDirection: Desc ) {
                items {
                    id
                    supplyingVaults {
                        id  
                        symbol
                        name
                        
                    }
                    uniqueKey
                    whitelisted
                    lltv
                    oracleAddress
                    irmAddress
                    creatorAddress
                    loanAsset {
                        address
                        symbol
                        decimals
                    }
                    collateralAsset {
                        address
                        symbol
                        decimals
                    }
                    state {
                        fee
                        utilization
                        supplyShares
                        supplyAssets
                        supplyAssetsUsd
                        borrowShares
                        borrowAssets
                        borrowAssetsUsd
                        collateralAssets
                        collateralAssetsUsd
                        supplyApy
                        borrowApy
                        netBorrowApy
                        netSupplyApy
                        dailyNetBorrowApy
                        dailyNetSupplyApy
                        rewards { supplyApr, borrowApr }

                    }
                }
                pageInfo {
                    count
                    countTotal
                    limit
                    skip
                }
            }
      }`,
    variables: variables,
  };
};

export const queryWhitelistedVaults = (variables: {
  skip: number;
  first: number;
  chainId: number;
}) => {
  return {
    query: `query Vaults($skip: Int!, $first: Int!, $chainId: Int!){
        vaults (
            first: $first,
            skip: $skip,
            where:  {chainId_in: [$chainId], whitelisted: true},
            orderBy: TotalAssetsUsd,
            orderDirection: Desc){
                items {
                    id
                    address
                    name
                    whitelisted
                    creatorAddress
                    metadata {
                        description
                        image
                    }
                    warnings {
                        level
                        type
                    }
                    state {
                        totalAssets
                        totalAssetsUsd
                        totalSupply
                        apy
                        netApy
                        fee
                        dailyApy
                        dailyNetApy
                        yearlyApy
                        yearlyNetApy
                        rewards { supplyApr }
                    }
                }
                pageInfo {
                    count
                    countTotal
                    limit
                    skip
                }
            }
      }`,
    variables: variables,
  };
};

export const queryMarketStateByUniqueKey = (variables: {
  uniqueKey: string;
  chainId: number;
}) => {
  return {
    query: `query MarketByUniqueKey($uniqueKey: String!, $chainId: Int!){
        marketByUniqueKey(
            uniqueKey: $uniqueKey,
            chainId: $chainId) {
                state {            
                collateralAssets
                collateralAssetsUsd
                borrowAssets
                borrowAssetsUsd
                supplyAssets
                supplyAssetsUsd
                liquidityAssets
                liquidityAssetsUsd

                totalLiquidity
                totalLiquidityUsd     
                
                supplyApy
                borrowApy
                allTimeBorrowApy
                allTimeNetBorrowApy
                allTimeNetSupplyApy
                allTimeSupplyApy
                
                yearlyBorrowApy
                yearlyNetBorrowApy
                yearlyNetSupplyApy
                yearlySupplyApy

                dailyBorrowApy
                dailyNetBorrowApy
                dailyNetSupplyApy
                dailyPriceVariation
                dailySupplyApy
                
                rewards {
                    supplyApr,
                    borrowApr
                    }
                }
            }
      }`,
    variables: variables,
  };
};

export const queryCurators = (variables: { chainId: number }) => {
  return {
    query: `query Curators($chainId: Int!){
        curators(where: {chainId_in: [$chainId]}){
            items {
                id
                name
                image
                state {
                    aum
                }
                verified
            }
        }        
      }`,
    variables: variables,
  };
};

export const queryUserDataByAddress = (variables: {
  address: string;
  chainId: number;
}) => {
  return {
    query: `query UserByAddress($address: String!, $chainId: Int!) {
        userByAddress(
            chainId: $chainId
            address: $address){
                address
                marketPositions {
                    market {
                        uniqueKey
                    }
                    state {
                        borrowAssets
                        borrowAssetsUsd
                        supplyAssets
                        supplyAssetsUsd  
                        collateralUsd
                        pnl
                        pnlUsd
                        pnl
                    }
                }
                vaultPositions {
                    vault {
                        address
                        name
                    }
                    state {
                        assets
                        assetsUsd
                        shares  
                    }
                }
                transactions {
                    hash
                    timestamp
                    type
                }
            }            
        }`,
    variables: variables,
  };
};
