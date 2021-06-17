import './VaultDetails.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { formatPercentage, fromDecimals, getBalanceOfAsset, toDecimals } from '../../util/constants'
import { faChevronDown, faLongArrowAltRight, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DecimalInput from '../Util/DecimalInput'
import { getAccountPosition, getAcoVaultInfo } from '../../util/contractHelpers/acoVaultMethods'
import WithdrawVaultModal from './WithdrawVaultModal'
import DepositVaultModal from './DepositVaultModal'
import Web3Utils from 'web3-utils'
import { acoVaultsV2 } from '../../util/network'

class VaultDetails extends Component {
  constructor(props) {
    super(props)
    this.state = { depositBalance: null, withdrawBalance: null, depositValue: "", withdrawValue: ""}
  }

  componentDidMount = () => {
    getAcoVaultInfo(this.props.vaultAddress).then(acoVaultInfo => {
      this.setState({acoVaultInfo: acoVaultInfo}, this.updateBalances)
    })
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.componentDidMount()
    }
    else if (this.context.web3.selectedAccount && this.props.accountToggle !== prevProps.accountToggle) {
      this.updateBalances()
    }
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  updateBalances = () => {
    this.setState({vaultBalance:null,depositBalance:null,accountPosition:null})
    if (this.isConnected() && this.state.acoVaultInfo) {
      getBalanceOfAsset(this.state.acoVaultInfo.address, this.context.web3.selectedAccount).then(vaultBalance => {
        this.setState({vaultBalance: vaultBalance}, this.getCurrentAccountPosition)
      })
      getBalanceOfAsset(this.state.acoVaultInfo.tokenInfo.address, this.context.web3.selectedAccount).then(vaultTokenBalance => {
        this.setState({depositBalance: vaultTokenBalance})
      })
    }
  }

  getCurrentAccountPosition = () => {
    getAccountPosition(this.state.acoVaultInfo.address, this.context.web3.selectedAccount, this.state.vaultBalance, this.state.acoVaultInfo.decimals).then(accountPosition => {
      this.setState({accountPosition: accountPosition})
    })
  }

  onDepositValueChange = (value) => {
    this.setState({ depositValue: value })
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

  getFormattedDepositBalance = () => {
    if (this.state.depositBalance && this.state.acoVaultInfo) {
      return fromDecimals(this.state.depositBalance, this.state.acoVaultInfo.tokenInfo.decimals)
    }
    else {
      return null
    }
  }

  onDepositClick = () => {
    if (this.canDeposit()) {
      let info = {}
      info.address = this.state.acoVaultInfo.address
      info.amount = toDecimals(this.state.depositValue, this.state.acoVaultInfo.tokenInfo.decimals)
      info.depositAsset = this.state.acoVaultInfo.tokenInfo.address
      info.depositAssetSymbol = this.state.acoVaultInfo.tokenInfo.symbol
      info.depositValue = this.state.depositValue
      this.setState({depositVaultModalInfo: info})
    }
  }

  onDepositHide = (refresh) => {
    if (refresh) {
      this.updateBalances()
    }
    this.setState({depositVaultModalInfo: null})
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

  onMaxDepositClick = () => {
    this.onDepositValueChange(this.getFormattedDepositBalance())
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

  canDeposit = () => {
    return this.state.acoVaultInfo !== null && this.state.depositValue !== null && this.state.depositValue !== "" && !this.isInsufficientFundsToDeposit()
  }  

  isInsufficientFundsToDeposit = () => {
    return this.state.acoVaultInfo != null && this.state.depositValue !== null && this.state.depositValue !== "" && this.state.depositBalance !== null && toDecimals(this.state.depositValue, this.state.acoVaultInfo.tokenInfo.decimals).gt(this.state.depositBalance)
  }

  canWithdraw = () => {
    return this.state.acoVaultInfo != null && this.state.withdrawValue !== null && this.state.withdrawValue !== "" && !this.isInsufficientFundsToDeposit()
  }  

  isInsufficientFundsToWithdraw = () => {
    return this.state.acoVaultInfo != null && this.state.withdrawValue !== null && this.state.withdrawValue !== "" && this.state.vaultBalance !== null && toDecimals(this.state.withdrawValue, this.state.acoVaultInfo.decimals).gt(this.state.vaultBalance)
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  render() {
    let vaultAddress = this.props.vaultAddress && this.props.vaultAddress.toLowerCase()
    let vaultConfig = acoVaultsV2()
    return <div className="card vault-card">
    <div className={"card-header collapsed "+(this.isConnected() ? "" : "disabled")} id={"heading"+vaultAddress} data-toggle="collapse" data-target={"#collapse"+vaultAddress} aria-expanded="false" aria-controls={"collapse"+vaultAddress}>
      <div className="vault-name">
        <img src={"/images/vaults/"+vaultConfig[vaultAddress].img} alt="ERC-20" />
        {vaultConfig[vaultAddress].name}
      </div>
      <div className="header-separator"></div>
      {!this.isConnected() ? <div className="card-body">
        <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
          <div>CONNECT WALLET</div>
        </div>
      </div> :
      <>
      <div className="vault-details">
        <div className="vault-apy">
          <div>
            APY
          </div>
          <div className="vault-apy-value">
            {this.props.CRVAPYs && this.props.CRVAPYs["3pool"] && formatPercentage(this.props.CRVAPYs["3pool"]/100.0)}
          </div>
        </div>
        <div className="right-arrow">
          <FontAwesomeIcon icon={faLongArrowAltRight}/>
        </div>
        <div className="vault-option">
          <div>ETH {this.state.acoVaultInfo ? (this.state.acoVaultInfo.currentAcoTokenInfo.isCall ? "CALL": "PUT") : ""} OPTION</div>
          {this.state.acoVaultInfo && <div className="vault-current-option"><span>Current option:</span><span>{this.state.acoVaultInfo.currentAcoTokenInfo.name}</span></div>}
        </div>
      </div>
      <FontAwesomeIcon className="vault-chevron" icon={faChevronDown}/>
      </>}      
    </div>    
    <div id={"collapse"+vaultAddress} className="collapse" aria-labelledby={"heading"+vaultAddress} data-parent="#vaultsAccordion">      
      {this.isConnected() && <div className="card-body">
        <div className="input-row">
          <div className={"input-column " + (this.isInsufficientFundsToDeposit() ? "insufficient-funds-error" : "")}>
            <div className="input-label balance-info">BALANCE:&nbsp;{(this.getFormattedDepositBalance()) ? (this.getFormattedDepositBalance() + " "+ this.state.acoVaultInfo.tokenInfo.symbol) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</div>
            <div className="input-field">
              <DecimalInput tabIndex="-1" onChange={this.onDepositValueChange} value={this.state.depositValue}></DecimalInput>
              <div className="max-btn" onClick={this.onMaxDepositClick}>MAX</div>
            </div>
            <div className={"action-btn "+(this.canDeposit() ? "" : "disabled")} onClick={this.onDepositClick}>DEPOSIT</div>
          </div>
          <div className={"input-column " + (this.isInsufficientFundsToWithdraw() ? "insufficient-funds-error" : "")}>
            <div className="input-label balance-info">BALANCE:&nbsp;{(this.getFormattedWithdrawBalance()) ? (this.getFormattedWithdrawBalance() + " SHARES") : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</div>
            <div className="input-field">
              <DecimalInput tabIndex="-1" onChange={this.onWithdrawValueChange} value={this.state.withdrawValue}></DecimalInput>
              <div className="max-btn" onClick={this.onMaxWithdrawClick}>MAX</div>
            </div>
            <div className={"outline-btn "+(this.canWithdraw() ? "" : "disabled")} onClick={this.onWithdrawClick}>WITHDRAW</div>
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
              <tr key={tokenPosition.acoToken}>
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
    {this.state.depositVaultModalInfo && <DepositVaultModal {...this.props} info={this.state.depositVaultModalInfo} onHide={this.onDepositHide} />}
    {this.state.withdrawVaultModalInfo && <WithdrawVaultModal {...this.props} info={this.state.withdrawVaultModalInfo} onHide={this.onWithdrawHide} />}
  </div>
  }
}

VaultDetails.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(VaultDetails)