import './SimpleSellModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { getFormattedOpenPositionAmount } from '../../util/acoTokenMethods'
import { toDecimals, formatWithPrecision, maxAllowance, erc20Proxy } from '../../util/constants'
import { checkTransactionIsMined, getNextNonce, sendTransactionWithNonce } from '../../util/web3Methods'
import Web3Utils from 'web3-utils'
import StepsModal from '../StepsModal/StepsModal'
import DecimalInput from '../Util/DecimalInput'
import { allowDeposit, allowance } from '../../util/erc20Methods'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { getSwapQuote, isInsufficientLiquidity } from '../../util/Zrx/zrxApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

class SimpleSellModal extends Component {
  constructor(props) {
    super(props)
    this.state = { flashAvailable: null, selectedTab: null, minimumReceivedAmount: "", optionsAmount: "", collateralValue: "", exerciseFee: "", payValue: "", payAssetBalance: "" }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair ||
      this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  onSellClick = () => {
    if (this.canSell()) {
      getNextNonce(this.context.web3.selectedAccount).then(nonce => {
        var stepNumber = 0
        this.needApprove().then(needApproval => {
          if (needApproval) {
            this.setStepsModalInfo(++stepNumber, needApproval)
            allowDeposit(this.context.web3.selectedAccount, maxAllowance, this.props.position.option.acoToken, erc20Proxy, nonce)
              .then(result => {
                if (result) {
                  this.setStepsModalInfo(++stepNumber, needApproval)
                  checkTransactionIsMined(result).then(result => {
                    if (result) {
                      this.sendSellTransaction(stepNumber, ++nonce, needApproval)
                    }
                    else {
                      this.setStepsModalInfo(-1, needApproval)
                    }
                  })
                    .catch(() => {
                      this.setStepsModalInfo(-1, needApproval)
                    })
                }
                else {
                  this.setStepsModalInfo(-1, needApproval)
                }
              })
              .catch(() => {
                this.setStepsModalInfo(-1, needApproval)
              })
          }
          else {
            stepNumber = 2
            this.sendSellTransaction(stepNumber, nonce, needApproval)
          }
        })
      })
    }
  }

  sendSellTransaction = (stepNumber, nonce, needApproval) => {
    this.setStepsModalInfo(++stepNumber, needApproval)
    sendTransactionWithNonce(this.state.swapQuote.gasPrice, null, this.context.web3.selectedAccount, this.state.swapQuote.to, this.state.swapQuote.value, this.state.swapQuote.data, null, nonce)
      .then(result => {
        if (result) {
          this.setStepsModalInfo(++stepNumber, needApproval)
          checkTransactionIsMined(result)
            .then(result => {
              if (result) {
                this.setStepsModalInfo(++stepNumber, needApproval)
              }
              else {
                this.setStepsModalInfo(-1, needApproval)
              }
            })
            .catch(() => {
              this.setStepsModalInfo(-1, needApproval)
            })
        }
        else {
          this.setStepsModalInfo(-1, needApproval)
        }
      })
      .catch(() => {
        this.setStepsModalInfo(-1, needApproval)
      })
  }

  setStepsModalInfo = (stepNumber, needApproval) => {
    var title = (needApproval && stepNumber <= 2) ? "Unlock token" : "Sell"
    var subtitle = ""
    var img = null
    var option = this.props.position.option
    var unlockSymbol =  (option.strikeAssetInfo.symbol)
    if (needApproval && stepNumber === 1) {
      subtitle = "Confirm on " + this.context.web3.name + " to unlock " + unlockSymbol + "."
      img = <MetamaskLargeIcon />
    }
    else if (needApproval && stepNumber === 2) {
      subtitle = "Unlocking " + unlockSymbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = "Confirm on " + this.context.web3.name + " to sell " + this.state.optionsAmount + " " + option.acoTokenInfo.symbol  + "."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 4) {
      subtitle = "Selling " + this.state.optionsAmount + " " + option.acoTokenInfo.symbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 5) {
      subtitle = "You have successfully sold the options."
      img = <DoneLargeIcon />
    }
    else if (stepNumber === -1) {
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon />
    }

    var steps = []
    if (needApproval) {
      steps.push({ title: "Unlock", progress: stepNumber > 2 ? 100 : 0, active: true })
    }
    steps.push({ title: "Sell", progress: stepNumber > 4 ? 100 : 0, active: stepNumber >= 3 ? true : false })
    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        steps: steps,
        img: img,
        isDone: (stepNumber === 5 || stepNumber === -1),
        onDoneButtonClick: (stepNumber === 5 ? this.onDoneButtonClick : this.onHideStepsModal)
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

  needApprove = () => {
    return new Promise((resolve) => {
        allowance(this.context.web3.selectedAccount, this.props.position.option.acoToken, erc20Proxy).then(result => {
          var resultValue = new Web3Utils.BN(result)
          resolve(resultValue.lt(this.getOptionAmountToDecimals()))
        })
    })
  }

  getButtonMessage = () => {
    if (!this.state.optionsAmount || this.state.optionsAmount <= 0) {
      return "Enter an amount"
    }
    if (this.isInsufficientFunds()) {
      return "Insufficient funds"
    }
    if (this.state.errorMessage) {
      return this.state.errorMessage
    }
    
    return null
  }

  canSell = () => {
    return (!this.state.loadingSwap && this.getButtonMessage() === null) 
  }
  
  getAcoOptionPrice = () => {    
    if (this.state.swapQuote) {
      return parseFloat(this.state.swapQuote.price)
    }
    return null
  }

  getOptionAmountToDecimals = () => {
    return toDecimals(this.state.optionsAmount, this.props.position.option.acoTokenInfo.decimals)
  }

  isInsufficientFunds = () => {
    return this.getOptionAmountToDecimals().gt(new Web3Utils.BN(this.props.position.openPosition))
  }

  onMaxClick = () => {
    var balance = getFormattedOpenPositionAmount(this.props.position)
    this.onOptionsAmountChange(balance)
  }

  onOptionsAmountChange = (value) => {
    this.setState({ optionsAmount: value }, () => this.refreshSwapQuote())
  }

  refreshSwapQuote = () => {
    var selectedOption = this.props.position.option
    var amount = this.state.optionsAmount
    this.setState({swapQuote: null, errorMessage: null, loadingSwap: true}, () => {
      if (selectedOption && amount && amount > 0) {
        getSwapQuote(selectedOption.strikeAsset, selectedOption.acoToken, toDecimals(amount, selectedOption.acoTokenInfo.decimals).toString(), false).then(swapQuote => {
          this.setState({swapQuote: swapQuote, errorMessage: null, loadingSwap: false})
        }).catch((err) => {
          if (isInsufficientLiquidity(err)) {
            this.setState({swapQuote: null, errorMessage: "Insufficient liquidity", loadingSwap: false})
          }
          else {
            this.setState({swapQuote: null, errorMessage: "Exchange unavailable", loadingSwap: false})
          }
        })
      }
      else {
        this.setState({swapQuote: null, errorMessage: null, loadingSwap: false})
      }
    })
  }

  formatAcoPrice = (optionPrice) => {
    if (optionPrice) {
      return formatWithPrecision(optionPrice) + " " + this.props.selectedPair.strikeAssetSymbol
    }
    return "-"
  }

  getTotalFormatted = () => {
    var price = this.getAcoOptionPrice()
    if (price) {
      return this.formatAcoPrice(price * this.state.optionsAmount)
    }
    return "-"
  }

  render() {
    return (<Modal className="aco-modal sell-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Header closeButton>SELL</Modal.Header>
      <Modal.Body>
      <div className="exercise-action">
          <div className="confirm-card">
            <div className="confirm-card-header">{this.props.position.option.acoTokenInfo.symbol}</div>
            <div className={"confirm-card-body " + (this.isInsufficientFunds() ? "insufficient-funds-error" : "")}>
              <div className="balance-column">
                <div>Amount available to sell: <span>{getFormattedOpenPositionAmount(this.props.position)} options</span></div>
              </div>
              <div className="card-separator"></div>
              <div className="input-row">
                <div className="input-column">
                  <div className="input-label">Amount</div>
                  <div className="input-field">
                    <DecimalInput tabIndex="-1" onChange={this.onOptionsAmountChange} value={this.state.optionsAmount}></DecimalInput>
                    <div className="max-btn" onClick={this.onMaxClick}>MAX</div>
                  </div>
                </div>
              </div>
            </div>           
            {this.state.optionsAmount && this.state.optionsAmount !== "" && this.state.optionsAmount > 0 && !this.isInsufficientFunds() &&
              <div className="confirm-card-body highlight-background border-top-separator">
                {!this.state.errorMessage && !this.state.loadingSwap && <div>
                  <div className="summary-title">SUMMARY</div>
                  <table className="aco-table summary-table">
                    <tbody>
                      <tr>
                        <td>Price per option</td>
                        <td>{this.formatAcoPrice(this.getAcoOptionPrice())}</td>
                      </tr>
                      <tr>
                        <td>Total</td>
                        <td>{this.getTotalFormatted()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>}
                {!this.state.errorMessage && this.state.loadingSwap && <div>
                  <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>
                </div>}
                {this.state.errorMessage && !this.state.loadingSwap && 
                  <div>
                    <div className="summary-title summary-error">{this.state.errorMessage}</div>
                  </div>
                }
              </div>}
            <div className={"confirm-card-actions " + ((this.state.optionsAmount && this.state.optionsAmount !== "" && this.state.optionsAmount > 0 && !this.isInsufficientFunds()) ? "highlight-background" : "")}>
              <div className="aco-button cancel-btn" onClick={() => this.props.onHide(false)}>Go back</div>
              <div className={"aco-button action-btn " + (this.canSell() ? "" : "disabled")} onClick={this.onSellClick}>Confirm</div>
            </div>
          </div>
          {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
        </div>
      </Modal.Body>
      </Modal>)
  }
}

SimpleSellModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(SimpleSellModal)