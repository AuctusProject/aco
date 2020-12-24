import './PoolDetails.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { formatPercentage, fromDecimals, getBalanceOfAsset } from '../../util/constants'
import { faChevronDown, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'

class PoolDetails extends Component {
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
  
  getCurrentAccountPosition = () => {
    
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

  getNetValueOfOpenPosition = (pool) => {
    return ""
  }
  
  onDepositClick = () => {
    this.setState({depositPool: this.props.pool})
  }

  onDepositHide = (refresh) => {
    if (refresh) {
      this.updateBalances()
    }
    this.setState({depositPool: null})
  }

  onWithdrawClick = () => {
    this.setState({withdrawPool: this.props.pool})
  }

  onWithdrawHide = (refresh) => {
    if (refresh) {
      this.updateBalances()
    }
    this.setState({withdrawPool: null})
  }

  getFormattedPoolName = (pool) => {
    return `WRITE ${pool.underlyingInfo.symbol} ${pool.isCall ? "CALL" : "PUT"} OPTIONS`
  }

  render() {
    let pool = this.props.pool
    let poolAddress = pool.acoPool
    let iconUrl = this.context && this.context.assetsImages && this.context.assetsImages[this.getPoolCollateral().symbol]
    return <div className="card pool-card">
    <div className={"card-header collapsed "+(this.isConnected() ? "" : "disabled")} id={"heading"+poolAddress} data-toggle="collapse" data-target={"#collapse"+poolAddress} aria-expanded="false" aria-controls={"collapse"+poolAddress}>
      <div className="pool-icon-header-info">
        <img className="pool-icon" src={iconUrl} alt="" />
        <div className="pool-header-info">
          <div className="pool-name">
            {this.getFormattedPoolName(pool)}
          </div>
          <div className="pool-description">
            Automatically sell {pool.isCall ? "call" : "put"} options
          </div>
          <div className="pool-liquidity">
            Liquidity Available: {this.formatAssetValue(pool.underlyingInfo, pool.underlyingBalance)} / {this.formatAssetValue(pool.strikeAssetInfo, pool.strikeAssetBalance)}
          </div>
          <div className="pool-net-value">
            Net Value of Open Position: {this.getNetValueOfOpenPosition(pool)}
          </div>
        </div>
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
        <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
          <div>CONNECT WALLET</div>
        </div>
      </div>:
      <div className="card-body">
        <div className="input-row">
          <div className="input-column">
          <div className="input-label balance-info">BALANCE:&nbsp;{this.getFormattedDepositBalance()}</div>
            <div className={"action-btn"} onClick={this.onDepositClick}>DEPOSIT</div>
          </div>
          <div className="input-column">
            <div className="input-label balance-info">BALANCE:&nbsp;{(this.getFormattedWithdrawBalance())}</div>
            <div className={"action-btn"} onClick={this.onWithdrawClick}>WITHDRAW</div>
          </div>
        </div>
        {this.state.accountPosition && <div className="vault-position">
          <div className="vault-position-title">Your position:</div>
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
                <td>{this.state.acoVaultInfo.tokenInfo.symbol}</td>
                <td className="value-highlight">{this.getFormattedWithdrawBalance()}</td>
                <td className="value-highlight">{this.getTotalPositionBalance()}</td>
              </tr>
              {this.state.accountPosition.acoTokensInfos && Object.values(this.state.accountPosition.acoTokensInfos).map(tokenPosition =>
              <tr key={tokenPosition.address}>
                <td>{tokenPosition.acoTokenInfo.name}</td>
                <td className="value-highlight">{fromDecimals(tokenPosition.balance, tokenPosition.acoTokenInfo.decimals)}</td>
                <td className="value-highlight">{this.getTotalAcoPositionBalance(tokenPosition)}</td>
              </tr>)}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td colSpan="2">TOTAL VALUE: ${this.getTotalBalanceValue()}</td>
              </tr>
            </tfoot>
            
          </table>
        </div>}
      </div>}
    </div>
    {this.state.depositPool && <DepositModal pool={this.state.depositPool} depositBalance={this.state.depositBalance} onHide={this.onDepositHide} />}
    {this.state.withdrawPool && <WithdrawModal pool={this.state.withdrawPool} withdrawBalance={this.state.withdrawBalance} onHide={this.onWithdrawHide} />}
  </div>
  }
}

PoolDetails.contextTypes = {
  assetsImages: PropTypes.object,
  web3: PropTypes.object
}
export default withRouter(PoolDetails)