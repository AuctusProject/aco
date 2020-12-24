import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { acoVaults, fromDecimals, getBalanceOfAsset, toDecimals } from '../../util/constants'
import { faChevronDown, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DecimalInput from '../Util/DecimalInput'
import { getAccountPosition, getAcoVaultInfo } from '../../util/acoVaultMethods'
import WithdrawVaultModal from './WithdrawVaultModal'
import Web3Utils from 'web3-utils'

class DiscontinuedVaultDetails extends Component {
  constructor(props) {
    super(props)
    this.state = { withdrawBalance: null, withdrawValue: ""}
  }

  componentDidMount = () => {
    getAcoVaultInfo(this.props.vaultAddress).then(acoVaultInfo => {
      this.setState({acoVaultInfo: acoVaultInfo}, this.updateBalances)
    })
  }

  componentDidUpdate = (prevProps) => {
    if (this.context.web3.selectedAccount && this.props.accountToggle !== prevProps.accountToggle) {
      this.updateBalances()
    }
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  updateBalances = () => {
    this.setState({vaultBalance:null, accountPosition:null})
    if (this.isConnected() && this.state.acoVaultInfo) {
      getBalanceOfAsset(this.state.acoVaultInfo.address, this.context.web3.selectedAccount).then(vaultBalance => {
        this.setState({vaultBalance: vaultBalance}, this.getCurrentAccountPosition)
      })
    }
  }

  getCurrentAccountPosition = () => {
    getAccountPosition(this.state.acoVaultInfo.address, this.context.web3.selectedAccount, this.state.vaultBalance, this.state.acoVaultInfo.decimals).then(accountPosition => {
      this.setState({accountPosition: accountPosition})
    })
  }

  
  onWithdrawValueChange = (value) => {
    this.setState({ withdrawValue: value })
  }

  getFormattedWithdrawBalance = () => {
    if (this.state.vaultBalance) {
      return fromDecimals(this.state.vaultBalance, this.state.acoVaultInfo.decimals)
    }
    else {
      return null
    }
  }

  onWithdrawClick = () => {
    if (this.canWithdraw()) {
      let info = {}
      info.address = this.state.acoVaultInfo.address
      if (this.getFormattedWithdrawBalance() === this.state.withdrawValue) {
        info.shares = this.state.vaultBalance  
      }
      else {
        info.shares = toDecimals(this.state.withdrawValue, this.state.acoVaultInfo.decimals)
      }
      info.withdrawValue = this.state.withdrawValue
      info.withdrawAssetSymbol = this.state.acoVaultInfo.tokenInfo.symbol
      this.setState({withdrawVaultModalInfo: info})
    }
  }

  onWithdrawHide = (refresh) => {
    if (refresh) {
      this.updateBalances()
    }
    this.setState({withdrawVaultModalInfo: null})
  }

  onMaxWithdrawClick = () => {
    this.onWithdrawValueChange(this.getFormattedWithdrawBalance())
  }

  getTotalPositionBalance = () => {
    if (this.state.accountPosition.balance) {
      return fromDecimals(new Web3Utils.BN(this.state.accountPosition.balance).add(new Web3Utils.BN(this.state.accountPosition.fee)), this.state.acoVaultInfo.decimals)
    }
    return ""
  }

  getTotalAcoPositionBalance = (tokenPosition) => {
    if (tokenPosition.value) {
      return tokenPosition.value.toString()
    }
    return ""
  }

  getTotalBalanceValue = () => {
    if (this.state.accountPosition && this.state.accountPosition.value) {
      return this.state.accountPosition.value.toString()
    }
    return ""
  }

  canWithdraw = () => {
    return this.state.acoVaultInfo != null && this.state.withdrawValue !== null && this.state.withdrawValue !== "" && !this.isInsufficientFundsToWithdraw()
  }  

  isInsufficientFundsToWithdraw = () => {
    return this.state.acoVaultInfo != null && this.state.withdrawValue !== null && this.state.withdrawValue !== "" && this.state.vaultBalance !== null && toDecimals(this.state.withdrawValue, this.state.acoVaultInfo.decimals).gt(this.state.vaultBalance)
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  showDiscontinuedVault = () => {
    return this.isConnected() && this.state.vaultBalance && this.state.vaultBalance > 0
  }

  render() {
    let vaultAddress = this.props.vaultAddress
    return !this.showDiscontinuedVault() ? <></> : <div className="card vault-card">
    <div className={"card-header collapsed "+(this.isConnected() ? "" : "disabled")} id={"heading"+vaultAddress} data-toggle="collapse" data-target={"#collapse"+vaultAddress} aria-expanded="false" aria-controls={"collapse"+vaultAddress}>
      <div className="vault-name">
        <img src={"/images/vaults/"+acoVaults[vaultAddress].img} alt="ERC-20" />
        <div className="">
          <div>{acoVaults[vaultAddress].name}</div>
          <span className="discontinued-label">(DISCONTINUED)</span>
        </div>
      </div>
      <div className="header-separator"></div>
      <div className="vault-details">
          This vault has been discontinued due to our last update, please withdraw your funds.
      </div>
      <FontAwesomeIcon className="vault-chevron" icon={faChevronDown}/>
    </div>    
    <div id={"collapse"+vaultAddress} className="collapse" aria-labelledby={"heading"+vaultAddress} data-parent="#vaultsAccordion">      
      <div className="card-body">
        <div className="input-row">
          <div className={"input-column " + (this.isInsufficientFundsToWithdraw() ? "insufficient-funds-error" : "")}>
            <div className="input-label balance-info">BALANCE:&nbsp;{(this.getFormattedWithdrawBalance()) ? (this.getFormattedWithdrawBalance() + " SHARES") : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</div>
            <div className="input-field">
              <DecimalInput tabIndex="-1" onChange={this.onWithdrawValueChange} value={this.state.withdrawValue}></DecimalInput>
              <div className="max-btn" onClick={this.onMaxWithdrawClick}>MAX</div>
            </div>
            <div className={"action-btn "+(this.canWithdraw() ? "" : "disabled")} onClick={this.onWithdrawClick}>WITHDRAW</div>
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
      </div>
    </div>
    {this.state.withdrawVaultModalInfo && <WithdrawVaultModal info={this.state.withdrawVaultModalInfo} onHide={this.onWithdrawHide} />}
  </div>
  }
}

DiscontinuedVaultDetails.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(DiscontinuedVaultDetails)