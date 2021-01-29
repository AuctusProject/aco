import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { formatPercentage, formatWithPrecision, fromDecimals, getBalanceOfAsset } from '../../util/constants'
import { faChevronDown, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import WithdrawModal from './WithdrawModal'
import { getAccountPoolPosition } from '../../util/acoPoolMethods'
import BigNumber from 'bignumber.js'
import { getCollateralInfo } from '../../util/acoTokenMethods'
import { ASSETS_INFO } from '../../util/assets'

class DiscontinuedPoolDetails extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  componentDidMount = () => {
    this.updateBalances()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.updateBalances()
    }
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  updateBalances = () => {    
    this.setState({withdrawBalance:null, depositBalance:null})
    if (this.isConnected() && this.props.pool) {
      getBalanceOfAsset(this.props.pool.acoPool, this.context.web3.selectedAccount).then(withdrawBalance => {
        this.setState({withdrawBalance: withdrawBalance}, this.getCurrentAccountPosition)
      })
      getBalanceOfAsset(this.getPoolCollateralAddress(), this.context.web3.selectedAccount).then(depositBalance => {
        this.setState({depositBalance: depositBalance})
      })
    }
  }

  getPoolCollateral = () => {
    var pool = this.props.pool
    if (pool.isCall) {
        return pool.underlyingInfo;
    } else {
        return pool.strikeAssetInfo;
    }
  }

  getPoolCollateralAddress = () => {
    var pool = this.props.pool
    if (pool.isCall) {
        return pool.underlying;
    } else {
        return pool.strikeAsset;
    }
  }

  getFormattedDepositBalance = () => {
    if (this.state.depositBalance) {
      return fromDecimals(this.state.depositBalance, this.getPoolCollateral().decimals) + " " + this.getPoolCollateral().symbol
    }
    else {
      return <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>
    }
  }

  getFormattedWithdrawBalance = () => {
    if (this.state.withdrawBalance) {
      return fromDecimals(this.state.withdrawBalance, this.props.pool.acoPoolInfo.decimals) + " SHARES"
    }
    else {
      return <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>
    }
  }

  formatVolatility = (pool) => {
    return formatPercentage(pool.volatility/100000.0,0)
  }

  formatAssetValue = (assetInfo, value) => {
    return (fromDecimals(value, assetInfo.decimals, 4, 0) ?? 0) + " " + assetInfo.symbol
  }

  getTotalNetValue = (underlyingValue, strikeValue) => {
    if (underlyingValue || strikeValue) {      
      var underlyingConverted = fromDecimals(underlyingValue, this.props.pool.underlyingInfo.decimals, 4, 0)
      var strikeConverted = fromDecimals(strikeValue, this.props.pool.strikeAssetInfo.decimals, 4, 0)
      
      var totalDollar = Number(this.getUnderlyingValue(underlyingConverted)) + Number(strikeConverted)
            
      return `~$${formatWithPrecision(Number(totalDollar))}`
    }
    return null
  }

  getUnderlyingValue = (underlyingAmount) => {
    var underlyingPrice = this.context.ticker && this.context.ticker[this.props.pool.underlyingInfo.symbol]
    if (!underlyingPrice) {
      underlyingPrice = 0
    }
    return underlyingAmount * underlyingPrice
  }
  
  onDepositClick = () => {
    this.setState({depositPool: this.props.pool})
  }

  onDepositHide = (refresh) => {
    if (refresh) {
      this.props.refreshPoolData(true)
      this.updateBalances()
    }
    this.setState({depositPool: null})
  }

  onWithdrawClick = () => {
    this.setState({withdrawPool: this.props.pool})
  }

  onWithdrawHide = (refresh) => {
    if (refresh) {
      this.props.refreshPoolData(true)
      this.updateBalances()
    }
    this.setState({withdrawPool: null})
  }

  getFormattedPoolName = (pool) => {
    return `WRITE ${pool.underlyingInfo.symbol} ${pool.isCall ? "CALL" : "PUT"} OPTIONS`
  }

  getCurrentAccountPosition = () => {
    this.setState({accountPosition: null}, () => {
      if (this.state.withdrawBalance && this.state.withdrawBalance > 0) {
        getAccountPoolPosition(this.props.pool.acoPool, this.state.withdrawBalance).then(accountPosition => {
          this.setState({accountPosition: accountPosition})
        })
      }
    })
  }

  getAccountTotalNetValue = () => {  
    return this.getTotalNetValue(this.getValueTimesShares(this.props.pool.underlyingPerShare), this.getValueTimesShares(this.props.pool.strikeAssetPerShare))
  }

  getValueTimesShares = (value) => {
    var convertedShares = this.state.withdrawBalance ? fromDecimals(this.state.withdrawBalance, this.props.pool.acoPoolInfo.decimals) : 0
    return new BigNumber(convertedShares).times(new BigNumber(value))
  }
  
  getTotalAcoPositionBalance = (tokenPosition) => {
    if (tokenPosition.value) {
      return tokenPosition.value.toString()
    }
    return ""
  }

  getAssetIconUrl = () => {
    var pool = this.props.pool
    var symbol = this.getPoolCollateral().symbol
    if (pool.isCall) {
      return this.context && this.context.assetsImages && this.context.assetsImages[symbol]
    }
    else {
      return ASSETS_INFO[symbol] ? ASSETS_INFO[symbol].icon : null
    }
  }

  showDiscontinued = () => {
    return this.isConnected() && this.state.withdrawBalance && this.state.withdrawBalance > 0
  }

  render() {
    if (!this.showDiscontinued()) {
      return <></>
    }
    let pool = this.props.pool
    let poolAddress = pool.acoPool
    
    let iconUrl = this.getAssetIconUrl()

    let underlyingBalanceFormatted = null
    let underlyingValueFormatted = null
    let strikeBalanceFormatted = null
    if (this.state.accountPosition) {
      let underlyingBalance = fromDecimals(this.state.accountPosition[0], this.props.pool.underlyingInfo.decimals, 4, 0)
      underlyingBalanceFormatted = underlyingBalance
      underlyingValueFormatted = formatWithPrecision(this.getUnderlyingValue(underlyingBalance))
      strikeBalanceFormatted = fromDecimals(this.state.accountPosition[1], this.props.pool.strikeAssetInfo.decimals, 4, 0)
    }

    return <div className="card pool-card">
    <div className={"card-header collapsed "+(this.isConnected() ? "" : "disabled")} id={"heading"+poolAddress} data-toggle="collapse" data-target={"#collapse"+poolAddress} aria-expanded="false" aria-controls={"collapse"+poolAddress}>
      <div className="pool-icon-header-info">
        <img className="pool-icon" src={iconUrl} alt="" />
        <div className="pool-header-info">
          <div className="pool-name">
            {this.getFormattedPoolName(pool)}
            <span className="discontinued-label">(DISCONTINUED)</span>
          </div>
          <div className="pool-liquidity">
            This pool has been discontinued due to our last update, please withdraw your funds.
          </div>
        </div>
      </div>
      <FontAwesomeIcon className="vault-chevron" icon={faChevronDown}/>
    </div>    
    <div id={"collapse"+poolAddress} className="collapse" aria-labelledby={"heading"+poolAddress} data-parent="#vaultsAccordion">
      <div className="card-body">
        <div className="input-row">
          <div className="input-column">
            <div className="input-label balance-info">BALANCE:&nbsp;{(this.getFormattedWithdrawBalance())}</div>
            <div className={"action-btn"} onClick={this.onWithdrawClick}>WITHDRAW</div>
          </div>
        </div>
        {!this.state.accountPosition ? 
        (this.state.withdrawBalance && this.state.withdrawBalance > 0 && <div className="vault-position">
          <div className="vault-position-title"><FontAwesomeIcon icon={faSpinner} className="fa-spin"/> Loading your position...</div>
        </div>)
        :
        <div className="vault-position">
          <div className="vault-position-title">Your position:</div>
          <div className="pool-net-value mb-3">
            Total Net Value: {this.getAccountTotalNetValue()}
          </div>
          <table className="aco-table mx-auto table-responsive-md">
            <thead>
              <tr>
                <th>Asset</th>
                <th className="value-highlight">Balance</th>
                <th className="value-highlight">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{this.props.pool.underlyingInfo.symbol}</td>
                <td className="value-highlight">{underlyingBalanceFormatted}</td>
                <td className="value-highlight">{underlyingValueFormatted}</td>
              </tr>
              <tr>
                <td>{this.props.pool.strikeAssetInfo.symbol}</td>
                <td className="value-highlight">{strikeBalanceFormatted}</td>
                <td className="value-highlight">{strikeBalanceFormatted}</td>
              </tr>
            </tbody>            
          </table>
          {this.state.accountPosition.acoTokensInfos && Object.values(this.state.accountPosition.acoTokensInfos).length > 0 && <><div className="vault-position-title mt-3">Open positions:</div>
          <table className="aco-table mx-auto table-responsive-md">
            <thead>
              <tr>
                <th>Asset</th>
                <th className="value-highlight">Open Position</th>
                <th className="value-highlight">Collateral Locked</th>
              </tr>
            </thead>
            <tbody>
            {this.state.accountPosition.acoTokensInfos && Object.values(this.state.accountPosition.acoTokensInfos).map(tokenPosition =>
              <tr key={tokenPosition.acoToken}>
                <td>{tokenPosition.acoTokenInfo.name}</td>
                <td className="value-highlight">{fromDecimals(tokenPosition.balance, tokenPosition.acoTokenInfo.decimals)}</td>
                <td className="value-highlight">{fromDecimals(tokenPosition.collateralAmount, getCollateralInfo(tokenPosition).decimals, 4, 0)}</td>
              </tr>)}
            </tbody>            
          </table></>}
        </div>}
      </div>
    </div>
    {this.state.withdrawPool && <WithdrawModal discontinued={true} pool={this.state.withdrawPool} withdrawBalance={this.state.withdrawBalance} onHide={this.onWithdrawHide} />}
  </div>
  }
}

DiscontinuedPoolDetails.contextTypes = {
  assetsImages: PropTypes.object,
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(DiscontinuedPoolDetails)