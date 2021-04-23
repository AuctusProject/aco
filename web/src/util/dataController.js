
import { ethAddress, optionsToIgnore, usdcAddress, wbtcAddress, defaultAcoCreator } from './constants'
import { 
  getAllPools, 
  getExercisedData, 
  getNotExpiredOptions, 
  getOption as getOptionSubgraph, 
  getPool as getPoolSubgraph, 
  getPoolHistoricalShares as getPoolHistoricalSharesSubgraph,
  getPoolCollateralRestores, 
  getPoolDeposits, 
  getPoolRedeems, 
  getPoolSwaps, 
  getPoolWithdrawals 
} from './subgraphApi'

const percentageDecimals = 5

let availableOptions = null
export const getAvailableOptions = async () => {
  if (availableOptions != null) {
    return availableOptions
  }
  let result = await getNotExpiredOptions()
  availableOptions = parseSubgraphAcos(result, true, true)
  return availableOptions
}

export const getAvailableOptionsByUnderlying = async (underlying) => {
  let result = await getAvailableOptions()
  return result.filter((c) => c.underlying === underlying.toLowerCase())
}

export const getAvailableOptionsByPair = async (pair, optionType) => {
  let result = await getAvailableOptions()
  return result.filter((c) => 
    (optionType === null || optionType === undefined || ((optionType === 1 && c.isCall) || (optionType !== 1 && !c.isCall))) &&
    (!pair || (pair.underlyingSymbol === c.underlyingInfo.symbol && pair.strikeAssetSymbol === c.strikeAssetInfo.symbol))
  )
}

export const getOption = async (acoToken, removeExpired = true) => {
  if (!acoToken) {
    return null
  }
  let result = await getOptionSubgraph(acoToken.toLowerCase())
  if (result) {
    return parseSubgraphAco(result, false, removeExpired)
  }
  return null
}

export const listAvailablePairs = async () => {
  let result = await getAvailableOptions()
  return getPairsFromOptions(result)
}

export const refreshAvailableOptions = async () => {
  availableOptions = null
  return getAvailableOptions()
}

export const getPairsFromOptions = (options) => {
  let pairs = {}
  for (let i = 0; i < options.length; i++) {
    let option = options[i]
    if (!pairs[option.underlyingInfo.symbol + "_" + option.strikeAssetInfo.symbol]) {
      pairs[option.underlyingInfo.symbol + "_" + option.strikeAssetInfo.symbol] = {
        id: option.underlyingInfo.symbol + "_" + option.strikeAssetInfo.symbol,
        underlying: option.underlying,
        underlyingInfo: option.underlyingInfo,
        underlyingSymbol: option.underlyingInfo.symbol,
        strikeAsset: option.strikeAsset,
        strikeAssetInfo: option.strikeAssetInfo,
        strikeAssetSymbol: option.strikeAssetInfo.symbol
      }
    }
  }
  var ethPair = baseEthPair()
  if (!pairs[ethPair.id]) {
    pairs[ethPair.id] = ethPair
  }
  var wbtcPair = baseWbtcPair()
  if (!pairs[wbtcPair.id]) {
    pairs[wbtcPair.id] = wbtcPair
  }
  return Object.values(pairs)
}

export const getOptionsFromPair = (options, selectedPair) => {
  return options && selectedPair ? options.filter(o => 
    o.underlyingInfo.symbol === selectedPair.underlyingSymbol && 
    o.strikeAssetInfo.symbol === selectedPair.strikeAssetSymbol) : []
}

let allPools = null
export const getPools = async () => {
  if (allPools != null) {
    return allPools
  }
  let result = await getAllPools()
  allPools = parseSubgraphPools(result)
  return allPools
}

export const getPool = async (pool) => {
  if (!pool) {
    return null
  }
  let result = await getPoolSubgraph(pool.toLowerCase())
  if (result) {
    return parseSubgraphPool(result)
  }
  return null
}

export const getPoolEvents = async (pool) => {
  const events = await Promise.all([
    getPoolDeposits(pool),
    getPoolSwaps(pool),
    getPoolWithdrawals(pool),
    getPoolRedeems(pool),
    getPoolCollateralRestores(pool),
    getExercisedData(pool)
  ])
  let result = []
  for (let i = 0; i < events.length; ++i) {
    for (let j = 0; j < events[i].length; ++j) {
      let base = parseSubgraphTx(((i === 5) ? events[i][j].exercise.tx : events[i][j].tx))
      if (i === 0) {
        base.type = "deposit"
        base.data = parseSubgraphPoolDeposit(events[i][j])
      } else if (i === 1) {
        base.type = "swap"
        base.data = parseSubgraphPoolSwap(events[i][j])
      } else if (i === 2) {
        base.type = "withdraw"
        base.data = parseSubgraphPoolWithdrawal(events[i][j])
      } else if (i === 3) {
        base.type = "redeem"
        base.data = parseSubgraphPoolRedeem(events[i][j])
      } else if (i === 4) {
        base.type = "restore"
        base.data = parseSubgraphPoolCollateralRestore(events[i][j])
      } else {
        base.type = "exercise"
        base.data = parseSubgraphExercisedData(events[i][j])
      }
      result.push(base)
    }
  }
  result.sort((p,a)=>p.block>a.block?-1:p.block<a.block?1:p.txIndex>a.txIndex?-1:p.txIndex<a.txIndex?1:p.logIndex>a.logIndex?-1:p.logIndex<a.logIndex?1:0)
  return result
}

export const getPoolHistoricalShares = async (pool) => {
  let result = await getPoolHistoricalSharesSubgraph(pool)
  return parseSubgraphPoolHistoricalShares(result)
}

const parseSubgraphAcos = (acos, onlyWhitelisted, removeExpired) => {
  let result = []
  for (let i = 0; i < acos.length; ++i) {
    let aco = parseSubgraphAco(acos[i], onlyWhitelisted, removeExpired)
    if (aco) {
      result.push(aco) 
    }
  }
  return result
}

const parseSubgraphAco = (aco, onlyWhitelisted, removeExpired) => {
  if (optionsToIgnore.some((c) => c === aco.id)) {
    return null
  }
  if (removeExpired && parseInt(aco.expiryTime) < Math.ceil(Date.now()/1000)) {
    return null
  } 
  if (onlyWhitelisted && 
    (
      aco.strikeAsset.id !== usdcAddress || 
      (aco.underlying.id !== ethAddress && aco.underlying.id !== wbtcAddress 
        && aco.creator && !defaultAcoCreator.some((c) => c === aco.creator))
    )) { 
    return null
  }
  return {
    acoToken: aco.id,
    underlying: aco.underlying.id,
    strikeAsset: aco.strikeAsset.id,
    isCall: aco.isCall,
    expiryTime: parseInt(aco.expiryTime),
    strikePrice: parseSubgraphNum(aco.strikePrice, parseInt(aco.strikeAsset.decimals)),
    creator: aco.creator,
    acoTokenImplementation: aco.implementation,
    acoFee: parseSubgraphNum(aco.fee, percentageDecimals),
    acoTokenInfo: {
      symbol: aco.symbol,
      decimals: parseInt(aco.decimals)
    },
    underlyingInfo: {
      symbol: aco.underlying.symbol,
      decimals: parseInt(aco.underlying.decimals)
    },
    strikeAssetInfo: {
      symbol: aco.strikeAsset.symbol,
      decimals: parseInt(aco.strikeAsset.decimals)
    }
  }
}

const parseSubgraphPools = (pools) => {
  let result = []
  for (let i = 0; i < pools.length; ++i) {
    result.push(parseSubgraphPool(pools[i])) 
  }
  return result
}

const parseSubgraphPool = (pool) => {
  let openAcos = undefined 
  if (pool.acosDynamicData) {
    openAcos = []
    let now = Math.ceil(Date.now()/1000)
    for (let i = 0; i < pool.acosDynamicData.length; ++i) {
      if (parseInt(pool.acosDynamicData[i].aco.expiryTime) > now) {
        openAcos.push({
          name: pool.acosDynamicData[i].aco.name,
          address: pool.acosDynamicData[i].aco.id,
          collateralLocked: parseSubgraphNum(pool.acosDynamicData[i].collateralLocked, parseInt(pool.decimals)),
          collateralLockedValue: parseSubgraphNum(pool.acosDynamicData[i].collateralLockedValue, parseInt(pool.strikeAsset.decimals)),
          openPositionOptionsValue: parseSubgraphNum(pool.acosDynamicData[i].openPositionOptionsValue, parseInt(pool.strikeAsset.decimals)),
          netValue: parseSubgraphNum(pool.acosDynamicData[i].netValue, parseInt(pool.strikeAsset.decimals)),
          price: parseSubgraphNum(pool.acosDynamicData[i].price, parseInt(pool.strikeAsset.decimals)),
          tokenAmount: parseSubgraphNum(pool.acosDynamicData[i].acoAmount, parseInt(pool.underlying.decimals))
        })
      }
    }
  }
  return {
    acoPool: pool.id,
    address: pool.id,
    name: pool.name,
    underlying: pool.underlying.id,
    strikeAsset: pool.strikeAsset.id,
    isCall: pool.isCall,
    acoPoolImplementation: pool.implementation,
    admin: pool.poolAdmin,
    volatility: parseFloat(pool.baseVolatility) * 100,
    protocolFee: parseFloat(pool.fee) * 100,
    withdrawOpenPositionPenalty: parseFloat(pool.withdrawOpenPositionPenalty) * 100,
    tolerancePriceBelowMin: parseSubgraphNum(pool.tolerancePriceBelowMin, percentageDecimals),
    tolerancePriceBelowMax: parseSubgraphNum(pool.tolerancePriceBelowMax, percentageDecimals),
    tolerancePriceAboveMin: parseSubgraphNum(pool.tolerancePriceAboveMin, percentageDecimals),
    tolerancePriceAboveMax: parseSubgraphNum(pool.tolerancePriceAboveMax, percentageDecimals),
    minExpiration: parseInt(pool.minExpiration),
    maxExpiration: parseInt(pool.maxExpiration),
    totalSupply: parseSubgraphNum(pool.totalSupply, parseInt(pool.decimals)),
    holdersCount: parseInt(pool.holdersCount),
    underlyingBalance: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.underlyingBalance, parseInt(pool.underlying.decimals)),
    strikeAssetBalance: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.strikeAssetBalance, parseInt(pool.strikeAsset.decimals)),
    underlyingPerShare: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.underlyingPerShare, parseInt(pool.underlying.decimals)),
    strikeAssetPerShare: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.strikeAssetPerShare, parseInt(pool.strikeAsset.decimals)),
    underlyingTotalShare: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.underlyingTotalShare, parseInt(pool.underlying.decimals)),
    strikeAssetTotalShare: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.strikeAssetTotalShare, parseInt(pool.strikeAsset.decimals)),
    collateralLocked: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.collateralLocked, parseInt(pool.decimals)),
    collateralLockedValue: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.collateralLockedValue, parseInt(pool.strikeAsset.decimals)),
    openPositionOptionsValue: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.openPositionOptionsValue, parseInt(pool.strikeAsset.decimals)),
    netValue: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.netValue, parseInt(pool.strikeAsset.decimals)),
    totalValue: !pool.dynamicData ? "0" : parseSubgraphNum(pool.dynamicData.totalValue, parseInt(pool.strikeAsset.decimals)),
    openAcos: openAcos,
    acoPoolInfo: {
      symbol: pool.symbol,
      decimals: parseInt(pool.decimals)
    },
    underlyingInfo: {
      symbol: pool.underlying.symbol,
      decimals: parseInt(pool.underlying.decimals)
    },
    strikeAssetInfo: {
      symbol: pool.strikeAsset.symbol,
      decimals: parseInt(pool.strikeAsset.decimals)
    }
  }
}

const parseSubgraphPoolDeposit = (deposit) => {
  return {
    account: deposit.account,
    shares: parseSubgraphNum(deposit.shares, parseInt(deposit.pool.decimals)),
    collateralDeposited: parseSubgraphNum(deposit.collateralAmount, parseInt(deposit.pool.decimals))
  }
}

const parseSubgraphPoolWithdrawal = (withdrawal) => {
  let acosWithdrawn = [];
  for (let i = 0; i < withdrawal.openAcos.length; ++i) {
    acosWithdrawn.push({
      acoToken: withdrawal.openAcos[i].aco.id, 
      acoName: withdrawal.openAcos[i].aco.name, 
      amount: parseSubgraphNum(withdrawal.openAcos[i].amount, parseInt(withdrawal.pool.underlying.decimals))
    });
  }
  return {
    account: withdrawal.account,
    shares: parseSubgraphNum(withdrawal.shares, parseInt(withdrawal.pool.decimals)),
    underlyingWithdrawn: parseSubgraphNum(withdrawal.underlyingWithdrawn, parseInt(withdrawal.pool.underlying.decimals)),
    strikeAssetWithdrawn: parseSubgraphNum(withdrawal.strikeAssetWithdrawn, parseInt(withdrawal.pool.strikeAsset.decimals)),
    noLocked: withdrawal.noLocked,
    acos: acosWithdrawn
  }
}

const parseSubgraphPoolSwap = (swap) => {
  return {
    account: swap.account,
    acoToken: swap.aco.id,
    acoName: swap.aco.name,
    tokenAmount: parseSubgraphNum(swap.acoAmount, parseInt(swap.aco.underlying.decimals)),
    collateralLocked: parseSubgraphNum(swap.collateralLocked, parseInt(swap.aco.isCall ? swap.aco.underlying.decimals : swap.aco.strikeAsset.decimals)),
    price: parseSubgraphNum(swap.paymentAmount, parseInt(swap.aco.strikeAsset.decimals)),
    protocolFee: parseSubgraphNum(swap.protocolFee, parseInt(swap.aco.strikeAsset.decimals)),
    underlyingPrice: parseSubgraphNum(swap.underlyingPrice, parseInt(swap.aco.strikeAsset.decimals)),
    volatility: parseFloat(swap.volatility) * 100
  }
}

const parseSubgraphPoolCollateralRestore = (restore) => {
  return {
    caller: restore.caller,
    amountOut: parseSubgraphNum(restore.amountSold, parseInt(restore.pool.isCall ? restore.pool.strikeAsset.decimals : restore.pool.underlying.decimals)),
    collateralRestored: parseSubgraphNum(restore.collateralRestored, parseInt(restore.pool.isCall ? restore.pool.underlying.decimals : restore.pool.strikeAsset.decimals))
  }
}

const parseSubgraphPoolRedeem = (redeem) => {
  return {
    acoToken: redeem.aco.id,
    acoName: redeem.aco.name,
    collateralRedeemed: parseSubgraphNum(redeem.collateralRedeemed, parseInt(redeem.pool.decimals))
  }
}

const parseSubgraphExercisedData = (data) => {
  return {
    acoToken: data.exercise.aco.id,
    acoName: data.exercise.aco.name,
    account: data.exercise.account,
    paidAmount: parseSubgraphNum(data.paymentReceived, parseInt(data.exercise.aco.isCall ? data.exercise.aco.strikeAsset.decimals : data.exercise.aco.underlying.decimals)),
    tokenAmount: parseSubgraphNum(data.exercisedTokens, parseInt(data.exercise.aco.underlying.decimals)),
    collateralAmount: parseSubgraphNum(data.collateralAmount, parseInt(data.exercise.aco.isCall ? data.exercise.aco.underlying.decimals : data.exercise.aco.strikeAsset.decimals))
  }
}

const parseSubgraphPoolHistoricalShares = (historicalData) => {
  let result = []
  for (let i = 0; i < historicalData.length; ++i) {
    result.push({
      t: parseInt(historicalData[i].tx.timestamp),
      p: parseSubgraphNum(historicalData[i].underlyingPrice, parseInt(historicalData[i].pool.strikeAsset.decimals)),
      u: parseSubgraphNum(historicalData[i].underlyingPerShare, parseInt(historicalData[i].pool.underlying.decimals)),
      s: parseSubgraphNum(historicalData[i].strikeAssetPerShare, parseInt(historicalData[i].pool.strikeAsset.decimals))
    }) 
  }
  result.sort((a,b)=>a.t===b.t?0:a.t>b.t?-1:1)
  return result
}

const parseSubgraphTx = (tx) => {
  return {
    block: parseInt(tx.block),
    tx: tx.id,
    txIndex: parseInt(tx.index),
    logIndex: (tx.logIndex ? parseInt(tx.logIndex) : null)
  }
}

const parseSubgraphNum = (stringNum, decimals) => {
  let splittedNum = stringNum.split('.')
  if (splittedNum.length > 1) {
    let fraction = splittedNum[1].substring(0, decimals)
    for (let i = fraction.length; i < decimals; ++i) {
      fraction = fraction + '0'
    }
    return splittedNum[0] + fraction
  } else {
    return splittedNum[0]
  }
}

const baseEthPair = () => {
  return {
    id: "ETH_USDC",
    underlying: ethAddress,
    underlyingInfo: {symbol: "ETH", decimals: 18},
    underlyingSymbol: "ETH",
    strikeAsset: usdcAddress,
    strikeAssetInfo: {symbol: "USDC", decimals: 6},
    strikeAssetSymbol: "USDC"
  }
}

const baseWbtcPair = () => {
  return {
    id: "WBTC_USDC",
    underlying: wbtcAddress,
    underlyingInfo: {symbol: "WBTC", decimals: 8},
    underlyingSymbol: "WBTC",
    strikeAsset: usdcAddress,
    strikeAssetInfo: {symbol: "USDC", decimals: 6},
    strikeAssetSymbol: "USDC"
  }
}