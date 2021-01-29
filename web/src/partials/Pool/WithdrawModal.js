import './WithdrawModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { checkTransactionIsMined } from '../../util/web3Methods'
import StepsModal from '../StepsModal/StepsModal'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { getWithdrawNoLockedData, getWithdrawWithLocked, withdrawNoLocked, withdrawWithLocked } from '../../util/acoPoolMethods'
import { withdrawNoLocked as withdrawNoLockedv2, withdrawWithLocked as withdrawWithLockedv2} from '../../util/acoPoolMethodsv2'
import Modal from 'react-bootstrap/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCog, faInfoCircle, faSpinner } from '@fortawesome/free-solid-svg-icons'
import DecimalInput from '../Util/DecimalInput'
import ReactTooltip from 'react-tooltip'
import SlippageModal from '../SlippageModal'
import { DEFAULT_POOL_SLIPPAGE, formatPercentage, fromDecimals, toDecimals } from '../../util/constants'
import Web3Utils from 'web3-utils'
import BigNumber from 'bignumber.js'

class WithdrawModal extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      withdrawValue:"", 
      selectedTab: 1,
      maxSlippage: DEFAULT_POOL_SLIPPAGE
    }
  }

  componentDidMount = () => {
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  getWithdrawMinCollateral = () => {
    var collateralIndex = this.props.pool.isCall ? 0 : 1
    var collateralValue = this.state.withdrawNoLockedDataInfo[collateralIndex]
    var minCollateral = fromDecimals(new BigNumber(collateralValue).times(new BigNumber(1-this.state.maxSlippage)), 0, 0, 0)
    return minCollateral
  }  

  onWithdrawClick = () => {
    let stepNumber = 0
    this.setStepsModalInfo(++stepNumber)

    var withdrawNoLockedMethod = this.props.discontinued ? withdrawNoLocked : withdrawNoLockedv2
    var withdrawWithLockedMethod = this.props.discontinued ? withdrawWithLocked : withdrawWithLockedv2

    var withdrawPromise = this.state.selectedTab === 1 ? 
      withdrawNoLockedMethod(this.context.web3.selectedAccount, this.props.pool.acoPool, this.getWithdrawAssetValue(), this.getWithdrawMinCollateral()) :
      withdrawWithLockedMethod(this.context.web3.selectedAccount, this.props.pool.acoPool, this.getWithdrawAssetValue())
    
    withdrawPromise.then(result => {
        if (result) {
          this.setStepsModalInfo(++stepNumber)
          checkTransactionIsMined(result)
            .then(result => {
              if (result) {
                this.setStepsModalInfo(++stepNumber)
              }
              else {
                this.setStepsModalInfo(-1)
              }
            })
            .catch(() => {
              this.setStepsModalInfo(-1)
            })
        }
        else {
          this.setStepsModalInfo(-1)
        }
      })
      .catch(() => {
        this.setStepsModalInfo(-1)
      })
  }

  setStepsModalInfo = (stepNumber) => {
    var title = "Withdraw"
    var subtitle = ""
    var img = null
    if (stepNumber === 1) {
      subtitle = "Confirm on Metamask to withdraw"
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 2) {
      subtitle = "Processing withdrawal..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = "You have successfully withdrawn."
      img = <DoneLargeIcon />
    }
    else if (stepNumber === -1) {
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon />
    }

    var steps = []
    steps.push({ title: "Withdraw", progress: stepNumber > 2 ? 100 : 0, active: stepNumber >= 2 ? true : false })
    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        steps: steps,
        img: img,
        isDone: (stepNumber === 3 || stepNumber === -1),
        onDoneButtonClick: (stepNumber === 3 ? this.onDoneButtonClick : this.onHideStepsModal)
      }
    })
  }  

  onDoneButtonClick = () => {
    this.setState({ stepsModalInfo: null })    
    this.props.onHide(true)
  }

  onHideStepsModal = () => {
    this.setState({ stepsModalInfo: null })
  }
  
  selectTab = (selectedTab) => () => {
    this.setState({ selectedTab: selectedTab })
  }  

  isInsufficientFunds = () => {
    return this.getWithdrawAssetValue().gt(new Web3Utils.BN(this.props.withdrawBalance))
  }

  onMaxClick = () => {
    var balance = this.getWithdrawAssetBalanceFromDecimals()
    this.onValueChange(balance)
  }

  onValueChange = (value) => {
    this.setState({ withdrawValue: value, withdrawNoLockedDataInfo: null, withdrawWithLockedInfo: null }, this.getWithdrawInfo)
  }

  getFormattedWithdrawAssetBalance = () => {
    return this.getWithdrawAssetBalanceFromDecimals() + " SHARES"
  }  

  getWithdrawAssetBalanceFromDecimals = () => {
    return fromDecimals(this.props.withdrawBalance, this.getWithdrawAssetDecimals())
  }

  getWithdrawAssetValue = () => {
    return toDecimals(this.state.withdrawValue, this.getWithdrawAssetDecimals())
  }

  getWithdrawAssetDecimals = () => {
    return this.props.pool.acoPoolInfo.decimals
  }
  
  onSlippageClick = () => {
    let slippageModalInfo = {}
    slippageModalInfo.onClose = () => this.setState({slippageModalInfo: null})
    slippageModalInfo.setMaxSlippage = (value) => this.setState({maxSlippage: value})
    this.setState({slippageModalInfo: slippageModalInfo})
  }

  getSlippageFormatted = () => {
    return formatPercentage(this.state.maxSlippage)
  }

  canWithdraw = () => {
    if (!this.state.withdrawValue || this.state.withdrawValue <= 0) {
      return false
    }
    if (this.isInsufficientFunds()) {
      return false
    }
    if (this.state.selectedTab === 1 && !this.state.withdrawNoLockedDataInfo) {
      return false
    }
    if (this.state.selectedTab === 2 && !this.state.withdrawWithLockedInfo) {
      return false
    }
    return true
  }

  getUnderlyingWithdrawValue = () => {
    if (this.state.selectedTab === 1) {
      if (this.state.withdrawNoLockedDataInfo && this.state.withdrawNoLockedDataInfo[0]) {
        return fromDecimals(this.state.withdrawNoLockedDataInfo[0], this.props.pool.underlyingInfo.decimals) + " " + this.props.pool.underlyingInfo.symbol
      }
    }
    else {
      if (this.state.withdrawWithLockedInfo && this.state.withdrawWithLockedInfo[0]) {
        return fromDecimals(this.state.withdrawWithLockedInfo[0], this.props.pool.underlyingInfo.decimals) + " " + this.props.pool.underlyingInfo.symbol
      }
    }
    return "-"
  }

  getStrikeAssetWithdrawValue = () => {
    if (this.state.selectedTab === 1) {
      if (this.state.withdrawNoLockedDataInfo && this.state.withdrawNoLockedDataInfo[1]) {
        return fromDecimals(this.state.withdrawNoLockedDataInfo[1], this.props.pool.strikeAssetInfo.decimals) + " " + this.props.pool.strikeAssetInfo.symbol
      }
    }
    else {
      if (this.state.withdrawWithLockedInfo && this.state.withdrawWithLockedInfo[1]) {
        return fromDecimals(this.state.withdrawWithLockedInfo[1], this.props.pool.strikeAssetInfo.decimals) + " " + this.props.pool.strikeAssetInfo.symbol
      }
    }
    return <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>
  }

  isInsufficientLiquidity = () => {
    return this.state.selectedTab === 1 && 
      this.state.withdrawNoLockedDataInfo && !this.state.withdrawNoLockedDataInfo[2]
  }

  getWithdrawInfo = () => {
    getWithdrawNoLockedData(this.props.pool.acoPool, this.getWithdrawAssetValue()).then(withdrawNoLockedDataInfo => {
      this.setState({withdrawNoLockedDataInfo: withdrawNoLockedDataInfo})
    })
    getWithdrawWithLocked(this.props.pool.acoPool, this.getWithdrawAssetValue()).then(withdrawWithLockedInfo => {
      this.setState({withdrawWithLockedInfo: withdrawWithLockedInfo})
    })
  }

  showSummary = () => {
    return this.state.withdrawValue && this.state.withdrawValue !== "" && this.state.withdrawValue > 0 && !this.isInsufficientFunds()
  }

  render() {
    return (<Modal className="aco-modal no-header deposit-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Header closeButton></Modal.Header>
      <Modal.Body>
        <div className="exercise-action">
          <div className="btn-group pill-button-group">
            <button onClick={this.selectTab(1)} type="button" className={"pill-button " + (this.state.selectedTab === 1 ? "active" : "")}>WITHDRAW</button>
            <button onClick={this.selectTab(2)} type="button" className={"pill-button " + (this.state.selectedTab === 2 ? "active" : "")}>TRANSFER POSITIONS</button>
          </div>
          <div className="confirm-card-header">{this.props.pool.acoPoolInfo.symbol}</div>
          <div className="confirm-card">            
            <div className={"confirm-card-body " + (this.isInsufficientFunds() ? "insufficient-funds-error" : "")}>
              {this.state.selectedTab === 2 && <>
                <div>All open positions will be transferred to your wallet and you will need to redeem manually your collateral after expiration, if the options written are not exercised.</div>
                <div className="card-separator"></div>
              </>}
              <div className="balance-column">
                <div>BALANCE: <span>{this.state.loading ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : this.getFormattedWithdrawAssetBalance()}</span></div>
              </div>
              <div className="card-separator"></div>
              <div className="input-row">
                <div className="input-column">
                  <div className="input-label">Amount</div>
                  <div className="input-field">
                    <DecimalInput tabIndex="-1" onChange={this.onValueChange} value={this.state.withdrawValue}></DecimalInput>
                    <div className="max-btn" onClick={this.onMaxClick}>MAX</div>
                  </div>
                </div>
              </div>
              {this.state.selectedTab === 1 && <div className="input-row mt-3">
                <div className="input-column">
                  <div className="input-label">Slippage tolerance&nbsp;<FontAwesomeIcon data-tip data-for={"slippage-tolerance-tooltip"} icon={faInfoCircle}></FontAwesomeIcon></div>
                  <div className="input-value clickable slippage-value" onClick={this.onSlippageClick}>
                    {this.getSlippageFormatted()}
                    <FontAwesomeIcon icon={faCog}></FontAwesomeIcon>
                  </div>
                  <ReactTooltip className="info-tooltip" id={"slippage-tolerance-tooltip"}>
                    Your transaction will revert if the price changes unfavorably by more than this percentage.
                  </ReactTooltip>
                </div>
              </div>}
            </div>
            {this.showSummary() &&
            <div className="confirm-card-body highlight-background">
                <div>
                  <div className="summary-title">SUMMARY</div>
                  <table className="summary-table">
                    <tbody className={this.isInsufficientLiquidity() ? "insufficient-funds-error" : ""}>
                      <tr>
                        <td rowSpan="2">You'll receive</td>
                        <td>{this.getUnderlyingWithdrawValue()}</td>
                      </tr>
                      <tr>
                        <td>{this.getStrikeAssetWithdrawValue()}</td>
                      </tr>
                    </tbody>
                  </table>
                  {this.state.selectedTab === 2 && <div className="bottom-alert-message">Additionally all open positions will be transferred to your wallet.</div>}
                  {this.isInsufficientLiquidity() && 
                    <div className="bottom-alert-message">
                      The pool doesn't have enough liquidity available for withdraw right now. Alternatively you can <span onClick={this.selectTab(2)}>transfer all positions</span> to your wallet, or wait until there is liquidity available.
                    </div>}
                </div>
              </div>}
            <div className={"confirm-card-actions "+ (this.showSummary() ? "highlight-background" : "")}>
              <div className="aco-button cancel-btn" onClick={() => this.props.onHide(false)}>Go back</div>
              <div className={"aco-button action-btn " + (this.canWithdraw() ? "" : "disabled")} onClick={this.onWithdrawClick}>Confirm</div>
            </div>
          </div>
          {this.state.slippageModalInfo && <SlippageModal {...this.state.slippageModalInfo} maxSlippage={this.state.maxSlippage} />}
          {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
        </div>
      </Modal.Body>
    </Modal>
    )
  }
}

WithdrawModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(WithdrawModal)