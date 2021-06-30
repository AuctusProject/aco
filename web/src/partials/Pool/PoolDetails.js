import './PoolDetails.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getBalanceOfAsset, formatPercentage, formatWithPrecision, fromDecimals } from '../../util/constants'
import { faChevronDown, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import { ASSETS_INFO } from '../../util/assets'
import PoolAccountPosition from './PoolAccountPosition'

class PoolDetails extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  componentDidMount = () => {
    this.updateBalances()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.accountToggle !== prevProps.accountToggle) {
      this.updateBalances()
    }
  }

  getCurrentAccount() {
    return this.context && this.context.web3 && this.context.web3.selectedAccount ? this.context.web3.selectedAccount : null
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
        this.setState({withdrawBalance: withdrawBalance})
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
    return formatPercentage(pool.volatility/100.0,0)
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
    return `WRITE ${pool.underlyingInfo.symbol} ${pool.isCall ? "CALL" : "PUT"} OPTIONS${pool.isPrivate ? (" #" + pool.poolId) : ""}`
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

  viewDetails = (pool) => (event) => {
    this.props.history.push("/pools/details/"+pool.acoPool)
  }

  render() {
    let pool = this.props.pool
    let poolAddress = pool.acoPool
    let currentAccount = this.getCurrentAccount()
    let canDeposit = currentAccount && pool && (!pool.isPrivate || !pool.admin || pool.admin.toLowerCase() === currentAccount.toLowerCase())
    
    let iconUrl = this.getAssetIconUrl()

    return <div className="card pool-card">
    <div className={"card-header collapsed "+(this.isConnected() ? "" : "disabled")} id={"heading"+poolAddress} data-toggle="collapse" data-target={"#collapse"+poolAddress} aria-expanded="false" aria-controls={"collapse"+poolAddress}>
      <div className="pool-icon-header-info">
        <img className="pool-icon" src={iconUrl} alt="" />
        <div className="pool-header-info">
          <div className="pool-name-detail">
            {this.getFormattedPoolName(pool)}
            {pool.isPrivate && <div className="pool-private"><FontAwesomeIcon icon={faLock}/>Private</div>}
          </div>
          <div className="pool-liquidity">
            Liquidity Available: {this.formatAssetValue(pool.underlyingInfo, pool.underlyingBalance)} / {this.formatAssetValue(pool.strikeAssetInfo, pool.strikeAssetBalance)}
          </div>
          <div className="pool-net-value">
            Total Pool Net Value: {this.getTotalNetValue(pool.underlyingTotalShare, pool.strikeAssetTotalShare)}
          </div>
        </div>
      </div>
      <div className="view-details-link" onClick={this.viewDetails(pool)}>
        <div className="view-details-icon"></div>
        <div className="view-details-label">{pool.isPrivate ? "Manage" : "View Details"}</div>
      </div>
      <div className="header-separator"></div>
      <div className="pool-header-iv-info">
        <div>IV</div>
        <div className="pool-iv-value">{this.formatVolatility(pool)}</div>
      </div>
      <FontAwesomeIcon className="vault-chevron" icon={faChevronDown}/>
    </div>    
    <div id={"collapse"+poolAddress} className="collapse" aria-labelledby={"heading"+poolAddress} data-parent="#vaultsAccordion">      
      {!this.isConnected() ? 
      <div className="card-body">
        <div>Connect your account to load your wallet information.</div>
        <div className="action-btn mt-2" onClick={this.onConnectClick}>
          <div>CONNECT WALLET</div>
        </div>
      </div>:
      <div className="card-body">
        <div className="input-row">
          {canDeposit && <div className="input-column">
            <div className="input-label balance-info">BALANCE:&nbsp;{this.getFormattedDepositBalance()}</div>
            <div className={"action-btn"} onClick={this.onDepositClick}>DEPOSIT</div>
          </div>}
          <div className="input-column">
            <div className="input-label balance-info">BALANCE:&nbsp;{(this.getFormattedWithdrawBalance())}</div>
            <div className={"outline-btn"} onClick={this.onWithdrawClick}>WITHDRAW</div>
          </div>
        </div>
        <PoolAccountPosition {...this.props} pool={this.props.pool} balance={this.state.withdrawBalance}/>
      </div>}
    </div>
    {this.state.depositPool && <DepositModal {...this.props} pool={this.state.depositPool} depositBalance={this.state.depositBalance} onHide={this.onDepositHide} />}
    {this.state.withdrawPool && <WithdrawModal {...this.props} pool={this.state.withdrawPool} withdrawBalance={this.state.withdrawBalance} onHide={this.onWithdrawHide} />}
  </div>
  }
}

PoolDetails.contextTypes = {
  assetsImages: PropTypes.object,
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(PoolDetails)