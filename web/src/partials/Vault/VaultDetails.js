import './VaultDetails.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { acoVaults, fromDecimals, getBalanceOfAsset } from '../../util/constants'
import { faChevronDown, faLongArrowAltRight, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DecimalInput from '../Util/DecimalInput'
import { getAccountPosition, getAcoVaultInfo } from '../../util/acoVaultMethods'

class VaultDetails extends Component {
  constructor(props) {
    super(props)
    this.state = { depositBalance: null, withdrawBalance: null, depositValue: "", withdrawValue: ""}
  }

  componentDidMount = () => {
    getAcoVaultInfo(this.props.vaultAddress).then(acoVaultInfo => {
      this.setState({acoVaultInfo: acoVaultInfo})
    })
  }

  updateBalances = () => {
    if (this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork) {
      getBalanceOfAsset(this.state.acoVaultInfo.address, this.context.web3.selectedAccount).then(vaultBalance => {
        this.setState({vaultBalance: vaultBalance})
      })
      getBalanceOfAsset(this.state.acoVaultInfo.tokenInfo.address, this.context.web3.selectedAccount).then(vaultTokenBalance => {
        this.setState({depositBalance: vaultTokenBalance})
      })
    }
  }

  getCurrentAccountPosition = () => {
    getAccountPosition(this.state.acoVaultInfo.address, this.context.web3.selectedAccount, this.state.vaultBalance).then(accountPosition => {
      this.setState({accountPosition: accountPosition})
    })
  }

  onDepositValueChange = (value) => {
    this.setState({ depositValue: value })
  }

  onWithdrawValueChange = (value) => {
    this.setState({ withdrawValue: value })
  }

  onDepositClick = () => {

  }

  onWithdrawClick = () => {

  }

  getFormattedWithdrawBalance = () => {
    if (this.state.accountPosition && this.state.acoVaultInfo) {
      return fromDecimals(this.state.accountPosition.balance, this.state.acoVaultInfo.tokenInfo.decimals)
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

  render() {
    let vaultAddress = this.props.vaultAddress
    let vaultPositions = this.props.vaultPositions
    return <div class="card vault-card">
    <div class="card-header collapsed" id={"heading"+vaultAddress} data-toggle="collapse" data-target={"#collapse"+vaultAddress} aria-expanded="false" aria-controls={"collapse"+vaultAddress}>
      <div class="vault-name">
        <img src={"/images/vaults/"+acoVaults[vaultAddress].img} alt="ERC-20" />
        {acoVaults[vaultAddress].name}
      </div>
      <div class="header-separator"></div>
      <div class="vault-details">
        <div class="vault-apy">
          <div>
            APY
          </div>
          <div class="vault-apy-value">
            4%
          </div>
        </div>
        <div className="right-arrow">
          <FontAwesomeIcon icon={faLongArrowAltRight}/>
        </div>
        <div class="vault-option">
          <div>ETH CALL OPTION</div>
          <div class="vault-current-option">Current option: ETH-240USDC-C-12JUN20-0800UTC</div>
        </div>
      </div>            
      <FontAwesomeIcon className="vault-chevron" icon={faChevronDown}/>
    </div>    
    <div id={"collapse"+vaultAddress} class="collapse" aria-labelledby={"heading"+vaultAddress} data-parent="#vaultsAccordion">
      <div class="card-body">
        <div className="input-row">
          <div className="input-column">
            <div className="input-label">BALANCE:&nbsp;{(this.getFormattedDepositBalance()) ? this.getFormattedDepositBalance() : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</div>
            <div className="input-field">
              <DecimalInput tabIndex="-1" onChange={this.onDepositValueChange} value={this.state.depositValue}></DecimalInput>
              <div className="max-btn" onClick={this.onMaxDepositClick}>MAX</div>
            </div>
            <div className="action-btn" onClick={this.onDepositClick()}>DEPOSIT</div>
          </div>
          <div className="input-column">
            <div className="input-label">BALANCE:&nbsp;{(this.getFormattedWithdrawBalance()) ? this.getFormattedWithdrawBalance() : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</div>
            <div className="input-field">
              <DecimalInput tabIndex="-1" onChange={this.onWithdrawValueChange} value={this.state.withdrawValue}></DecimalInput>
              <div className="max-btn" onClick={this.onMaxWithdrawClick}>MAX</div>
            </div>
            <div className="action-btn" onClick={this.onWithdrawClick()}>WITHDRAW</div>
          </div>
        </div>
        <div className="vault-position">
          <div className="vault-position-title">Your position:</div>
          <table className="aco-table mx-auto table-responsive-md">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Balance</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {vaultPositions && vaultPositions.map(position =>
              <tr>
                <td></td>
                <td></td>
                <td></td>
              </tr>)}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td colSpan="2">TOTAL VALUE: $100</td>
              </tr>
            </tfoot>
            
          </table>
        </div>
      </div>
    </div>
  </div>
  }
}

VaultDetails.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(VaultDetails)