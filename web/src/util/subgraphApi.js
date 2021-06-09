import Axios from 'axios'
import { subgraphUrl } from './constants'

const maxQuery = 1000

const baseOptionQuery = `{
  acotokens {
    id
    underlying {
    	id
      symbol
      decimals
    }
    strikeAsset {
      id
      symbol
      decimals
    }
    isCall
    strikePrice
    expiryTime
    decimals
    symbol
    creator
    implementation
    fee
  }
}`

const basePoolQuery = `{
  acopool2S {
    id
    underlying {
      id
      symbol
      decimals
    }
    strikeAsset {
      id
      symbol
      decimals
    }
    isCall
    isPrivate
    symbol
    name
    decimals
    baseVolatility
    implementation
    poolAdmin
    poolId
    fee
    withdrawOpenPositionPenalty
    totalSupply
    tolerancePriceBelowMin
    tolerancePriceBelowMax
    tolerancePriceAboveMin
    tolerancePriceAboveMax
    minStrikePrice
    maxStrikePrice
    minExpiration
    maxExpiration
    holdersCount
    dynamicData {
      tx {
        id
        timestamp
      }
      underlyingPrice
      underlyingBalance
      strikeAssetBalance
      underlyingPerShare
      strikeAssetPerShare
      underlyingTotalShare
      strikeAssetTotalShare
      collateralLocked
      collateralLockedValue
      openPositionOptionsValue
      netValue
      totalValue
    }
  }
}`

const detailedPoolQuery = `{
  acopool2S {
    id
    underlying {
      id
      symbol
      decimals
    }
    strikeAsset {
      id
      symbol
      decimals
    }
    isCall
    isPrivate
    symbol
    name
    decimals
    baseVolatility
    implementation
    poolAdmin
    poolId
    fee
    withdrawOpenPositionPenalty
    totalSupply
    tolerancePriceBelowMin
    tolerancePriceBelowMax
    tolerancePriceAboveMin
    tolerancePriceAboveMax
    minStrikePrice
    maxStrikePrice
    minExpiration
    maxExpiration
    holdersCount
    acosDynamicData (first: 75, orderBy: id, orderDirection: desc) {
      tx {
        id
        timestamp
      }
      aco {
        id
        symbol
        name
				decimals
        expiryTime
        strikePrice
      }
      price
      openPositionOptionsValue
      collateralLocked
      collateralLockedValue
      acoAmount
      netValue
    }
    dynamicData {
      tx {
        id
        timestamp
      }
      underlyingPrice
      underlyingBalance
      strikeAssetBalance
      underlyingPerShare
      strikeAssetPerShare
      underlyingTotalShare
      strikeAssetTotalShare
      collateralLocked
      collateralLockedValue
      openPositionOptionsValue
      netValue
      totalValue
    }
  }
}`

const poolSwapsQuery = `{
  poolSwaps {
    id
    aco {
      id
      name
      isCall
      underlying {
        decimals
      }
      strikeAsset {
        decimals
      }
    }
    account
    acoAmount
    paymentAmount
    protocolFee
    underlyingPrice
    volatility
    collateralLocked
    tx {
      id
      block
      timestamp
      index
      logIndex
    }
  }  
}`

const poolWithdrawalsQuery = `{
  withdrawals {
    id
    pool {
      decimals
      underlying {
        decimals
      }
      strikeAsset {
        decimals
      }
    }
    account
    shares
    noLocked
    underlyingWithdrawn
    strikeAssetWithdrawn
    openAcosCount
    openAcos (first: 75, orderBy: id, orderDirection: desc) {
      aco {
        id
        name
      }
      amount
    }
    tx {
      id
      block
      timestamp
      index
      logIndex
    }
  }
}`

const poolDepositsQuery = `{
  deposits {
    id
    pool {
      decimals
    }
    account
    shares
    collateralAmount
    tx {
      id
      block
      timestamp
      index
      logIndex
    }
  }
}`

const poolRedeemsQuery = `{
  acoredeems {
    id
    pool {
      decimals
    }
    caller
    collateralRedeemed
    aco {
      id
      name
    }
    tx {
      id
      block
      timestamp
      index
      logIndex
    }
  }
}`

const poolCollateralRetoresQuery = `{
  collateralRestores {
    id
    pool {
      underlying {
        decimals
      }
      strikeAsset {
        decimals
      }
      isCall
    }
    caller
    collateralRestored
    amountSold
    tx {
      id
      block
      timestamp
      index
      logIndex
    }
  }
}`

const exercisedQuery = `{
  exercisedAccounts {
    id
    account
    paymentReceived
    exercisedTokens
    collateralAmount
    exercise {
      account
      aco {
        id
        name
        isCall
        underlying {
          decimals
        }
        strikeAsset {
          decimals
        }
      }
      tx {
        id
        block
        timestamp
        index
        logIndex
      }
    }
  }
}`

const poolHistoricalSharesQuery = `{
  poolHistoricalShares {
    id
    underlyingPerShare
    strikeAssetPerShare
    underlyingPrice
    pool {
      underlying {
        decimals
      }
      strikeAsset {
        decimals
      }
    }
    tx {
      id
      timestamp
    }
  }
}`

const poolAccountBalancesQuery = `{
  poolAccounts {
    pool {
      id
      decimals
    }
    account
    balance
  }
}`

const callSubgraph = async (query, restriction = null, maxPages = null, lastId = null, page = 1) => {
  let subgraphData = parseSubgraphQuery(query, restriction, lastId)
  let result = await Axios.post(subgraphUrl, {"query": subgraphData.query})
  if (result && result.data) {
    if (result.data.data) {
      if (result.data.data.length === maxQuery && (!maxPages || maxPages < page)) {
        let moreData = await callSubgraph(query, restriction, maxPages, result.data.data[maxQuery - 1].id, ++page)
        if (moreData) {
          return result.data.data[subgraphData.response].concat(moreData)
        }
      }
      return result.data.data[subgraphData.response]
    } else if (result.data.errors) {
      console.error("query: " + subgraphData.query + " page: " + page)
      console.error(result.data.errors)
    }
  }
  return null
}

export const getAllOptions = async () => {
  let result = await callSubgraph(baseOptionQuery)
  return result || []
}

export const getAllPools = async () => {
  let result = await callSubgraph(basePoolQuery)
  return result || []
}

export const getNotExpiredOptions = async () => {
  let result = await callSubgraph(baseOptionQuery, {expiryTime_gt: Math.ceil(Date.now()/1000)})
  return result || []
}

export const getOptionsByDefinition = async (underlying = null, strikeAsset = null, isCall = null, removeExpired = true) => {
  let restriction = {}
  if (underlying) {
    restriction.underlying = underlying
  }
  if (strikeAsset) {
    restriction.strikeAsset = strikeAsset
  }
  if (isCall !== null && isCall !== undefined) {
    restriction.isCall = !!isCall
  }
  if (removeExpired === true) {
    restriction.expiryTime_gt = Math.ceil(Date.now()/1000)
  }
  let result = await callSubgraph(baseOptionQuery, restriction)
  return result || []
}

export const getOption = async (acoToken) => {
  let result = await callSubgraph(baseOptionQuery, {id:acoToken})
  if (result && result.length) {
    return result[0]
  }
  return null
}

export const getPool = async (pool) => {
  let result = await callSubgraph(detailedPoolQuery, {id:pool})
  if (result && result.length) {
    return result[0]
  }
  return null
}

export const getPoolsAccountBalances = async (account, pools) => {
  let result = await callSubgraph(poolAccountBalancesQuery, {balance_gt:0,account,pool_in:pools})
  return result || []
}

export const getPoolSwaps = async (pool) => {
  let result = await callSubgraph(poolSwapsQuery, {pool})
  return result || []
}

export const getPoolDeposits = async (pool) => {
  let result = await callSubgraph(poolDepositsQuery, {pool})
  return result || []
}

export const getPoolWithdrawals = async (pool) => {
  let result = await callSubgraph(poolWithdrawalsQuery, {pool})
  return result || []
}

export const getPoolRedeems = async (pool) => {
  let result = await callSubgraph(poolRedeemsQuery, {pool})
  return result || []
}

export const getPoolCollateralRestores = async (pool) => {
  let result = await callSubgraph(poolCollateralRetoresQuery, {pool})
  return result || []
}

export const getExercisedData = async (account) => {
  let result = await callSubgraph(exercisedQuery, {account})
  return result || []
}

export const getPoolHistoricalShares = async (pool) => {
  let result = await callSubgraph(poolHistoricalSharesQuery, {pool}, 1)
  return result || []
}

const parseRestriction = (restriction) => {
  let condition = ""
  let notFirst = false
  for (let p in restriction) {
    if (notFirst) {
      condition += ","
    }
    condition += p + ":" + parseQueryValue(restriction[p])
    notFirst = true
  }
  return condition
}

const parseQueryValue = (value) => {
  if (typeof value === "string") {
    return "\"" + value + "\""
  } else if (typeof value === "object") {
    if (value) {
      if (value.length !== undefined) {
        return JSON.stringify(value)
      } else {
        return parseRestriction(value)
      }
    } else {
      return "null"
    }
  } else {
    return value.toString()
  }
}

const parseSubgraphQuery = (query, restriction, lastId) => {
  let condition = (restriction && typeof restriction === "object") ? restriction : {}
  let whereCondition = parseRestriction(condition)
  if (lastId) {
    if (whereCondition) {
      whereCondition += ","
    }
    whereCondition += "id_lt:\"" + lastId + "\""
  }
  let finalCondition = "(first: " + maxQuery + ", orderBy: id, orderDirection: desc"
  if (whereCondition) {
    finalCondition += ", where: {" + whereCondition + "}) "
  } else {
    finalCondition += ") "
  }
  let splittedQuery = query.split('{')
  let response = splittedQuery[1].trim()
  splittedQuery[1] = splittedQuery[1] + finalCondition
  return {response: response, query: splittedQuery.join('{')}
}