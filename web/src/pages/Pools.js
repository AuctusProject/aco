import './Pools.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getAllAvailablePools } from '../util/acoPoolFactoryMethods'
import { formatDate, formatPercentage, fromDecimals, zero } from '../util/constants'
import Countdown from 'react-countdown'
import OptionBadge from '../partials/OptionBadge'
import { getAcoPools } from '../util/acoApi'
import { balanceOf } from '../util/erc20Methods'
import BigNumber from 'bignumber.js'
import DepositModal from '../partials/Pool/DepositModal'
import WithdrawModal from '../partials/Pool/WithdrawModal'
import Loading from '../partials/Util/Loading'

class Pools extends Component {
  constructor() {
    super()
    this.state = { allPools:[], loading: true }
  }
  
  componentDidMount = () => {
    if (this.isConnected()) {
      getAllAvailablePools().then(allPools => this.setPoolsBalance(allPools))
    }
    else {
      getAcoPools().then(notExpiredPools => this.setPoolsInfo(notExpiredPools, notExpiredPools))
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.setPoolsBalance(this.state.allPools)
    }
  }

  setPoolsBalance = (pools) => {
    var promises = []
    for (let index = 0; index < pools.length; index++) {
      const pool = pools[index]; 
      promises.push(balanceOf(pool.acoPool, this.context.web3.selectedAccount))
    }
    Promise.all(promises).then(results => {
      let filteredPools = []
      let now = (Date.now())/1000
      for (let index = 0; index < pools.length; index++) {
        const pool = pools[index]; 
        pool.balance = new BigNumber(results[index])
        //pool.poolStart = Date.now()/1000 + 60*60*24
        if (pool.maxExpiration > now || pool.balance.gt(zero)) {
          filteredPools.push(pool) 
        }
      }
      this.setPoolsInfo(pools, filteredPools)
    })
  }

  setPoolsInfo = (allPools, filteredPools) => {
    this.setState({allPools: allPools, pools: filteredPools, loading: false}) 
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  formatCollateralDeposited = (pool) => {
    return this.formatAssetValue(pool.isCall ? pool.underlyingInfo : pool.strikeAssetInfo, pool.collateralDeposited)
  }

  formatAssetValue = (assetInfo, value) => {
    return (fromDecimals(value, assetInfo.decimals, 4, 0) ?? 0) + " " + assetInfo.symbol
  }

  formatStrikeLimit = (pool) => {
    return fromDecimals(pool.minStrikePrice, pool.strikeAssetInfo.decimals, 4, 0) +
      " "+pool.strikeAssetInfo.symbol +
      " to " +
      fromDecimals(pool.maxStrikePrice, pool.strikeAssetInfo.decimals, 4, 0) +
      " "+pool.strikeAssetInfo.symbol
  }

  formatVolatility = (pool) => {
    return formatPercentage(pool.volatility/100000.0,0)
  }

  onDepositClick = (pool) => () => {
    this.setState({depositPool: pool})
  }

  onDepositHide = (refresh) => {
    if (refresh) {
      this.setPoolsBalance(this.state.allPools)
    }
    this.setState({depositPool: null})
  }

  onWithdrawClick = (pool) => () => {
    this.setState({withdrawPool: pool})
  }

  onWithdrawHide = (refresh) => {
    if (refresh) {
      this.setPoolsBalance(this.state.allPools)
    }
    this.setState({withdrawPool: null})
  }

  render() {
    return <div className="py-4">
        <div className="pools-wrapper">
          <div className="pooled-liquidity">
            <div className="pooled-liquidity-title">Pooled Liquidity</div>
            <div>Become a liquidity provider and receive premiums by automatically selling covered options.</div>
          </div>
        {this.state.pools && this.state.pools.map(pool => (
          <div className="pool-card" key={pool.acoPool}>
            <div className="pool-header">
              <div className="pool-title">
                <span className="pool-assets-type">
                  <span className="pool-assets">{pool.underlyingInfo.symbol}-{pool.strikeAssetInfo.symbol}</span>
                  <OptionBadge isCall={pool.isCall}/>
                </span>
              </div>
              {pool.poolStart * 1000 > Date.now() ?
                <div className="deposit-col">
                  <div className="action-btn btn-sm" onClick={this.onDepositClick(pool)}>DEPOSIT</div>
                  <span className="pool-countdown">Close in <Countdown date={pool.poolStart * 1000} /></span>
                </div> :
                (pool.maxExpiration * 1000 > Date.now() ? 
                  <span className="pool-countdown">Pool end in <Countdown date={pool.maxExpiration * 1000} /></span> :
                  <div className="action-btn btn-sm"  onClick={this.onWithdrawClick(pool)}>WITHDRAW</div>
                )
              }
            </div>
            <div className="pool-info">
              <div className="pool-info-label">Strike price range</div>
              <div className="pool-info-value">{this.formatStrikeLimit(pool)}</div>
            </div>
            <div className="pool-info">
              <div className="pool-info-label">Expiration range</div>
              <div className="pool-info-value">{formatDate(pool.minExpiration, true)} to {formatDate(pool.maxExpiration, true)}</div>
            </div>
            <div className="pool-info">
              <div className="pool-info-label">Minimum IV</div>
              <div className="pool-info-value">{this.formatVolatility(pool)}</div>
            </div>
            <div className="pool-info">
              <div className="pool-info-label">Total deposited</div>
              <div className="pool-info-value">{this.formatCollateralDeposited(pool)}</div>
            </div>
            <div className="pool-info">
              <div className="pool-info-label">Liquidity available</div>
              <div className="pool-info-value">{this.formatAssetValue(pool.underlyingInfo, pool.underlyingBalance)} / {this.formatAssetValue(pool.strikeAssetInfo, pool.strikeAssetBalance)}</div>
            </div>
          </div>
        ))}
        {this.state.loading && <Loading></Loading>}
        {!this.state.loading && this.state.pools && this.state.pools.length === 0 && <div className="pooled-liquidity-empty">
          No active pools
        </div>}
        </div>
        {this.state.depositPool && <DepositModal pool={this.state.depositPool} onHide={this.onDepositHide} />}
        {this.state.withdrawPool && <WithdrawModal pool={this.state.withdrawPool} onHide={this.onWithdrawHide} />}
      </div>
  }
}

Pools.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Pools)