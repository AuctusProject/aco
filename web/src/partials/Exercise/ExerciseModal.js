import './ExerciseModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { exercise, getOptionFormattedPrice, getFormattedOpenPositionAmount, getBalanceOfExerciseAsset, getExerciseInfo, getCollateralInfo, getCollateralAmount, getExerciseAddress, getExerciseValue, getMaxExercisedAccounts } from '../../util/contractHelpers/acoTokenMethods'
import { zero, formatDate, fromDecimals, toDecimals, isEther, PERCENTAGE_PRECISION, formatWithPrecision } from '../../util/constants'
import { checkTransactionIsMined, getNextNonce } from '../../util/web3Methods'
import Web3Utils from 'web3-utils'
import StepsModal from '../StepsModal/StepsModal'
import DecimalInput from '../Util/DecimalInput'
import { allowDeposit, allowance } from '../../util/contractHelpers/erc20Methods'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import Loading from '../Util/Loading'
import { getEstimatedReturn, hasUniswapPair, flashExercise, getFlashExerciseData } from '../../util/contractHelpers/acoFlashExerciseMethods'
import { acoFlashExerciseAddress, swapUrl } from '../../util/network'

class ExerciseModal extends Component {
  constructor(props) {
    super(props)
    this.state = { maxExercisedAccounts: null, flashAvailable: null, selectedTab: null, minimumReceivedAmount: "", optionsAmount: "", collateralValue: "", exerciseFee: "", payValue: "", payAssetBalance: "" }
  }

  componentDidMount = () => {
    getMaxExercisedAccounts(this.props.position.option).then(result => this.setState({ maxExercisedAccounts: result }))

    getBalanceOfExerciseAsset(this.props.position.option, this.context.web3.selectedAccount).then(result => {
      this.setState({ payAssetBalance: result, selectedTab: 2 })
    })
    hasUniswapPair(this.props.position.option.acoToken).then(result => {
      this.setState({ flashAvailable: result })
    })
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair ||
      this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  onConfirm = () => {
    if (this.canConfirm()) {
      getNextNonce(this.context.web3.selectedAccount).then(nonce => {
        var stepNumber = 0
        this.needApprove().then(needApproval => {
          if (needApproval) {
            this.setStepsModalInfo(++stepNumber, needApproval)
            this.sendAllowDeposit()
              .then(result => {
                if (result) {
                  this.setStepsModalInfo(++stepNumber, needApproval)
                  checkTransactionIsMined(result).then(result => {
                    if (result) {
                      this.sendExerciseTransaction(stepNumber, ++nonce, needApproval)
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
            this.sendExerciseTransaction(stepNumber, nonce, needApproval)
          }
        })
      })
    }
  }

  needApprove = () => {
    return new Promise((resolve) => {
      if (this.state.selectedTab === 1) {
        if (!this.isPayEth()) {
          allowance(this.context.web3.selectedAccount, getExerciseAddress(this.props.position.option), this.props.position.option.acoToken).then(result => {
            var resultValue = new Web3Utils.BN(result)
            resolve(resultValue.lt(toDecimals(this.state.payValue, this.getPayDecimals())))
          })
        }
        else {
          resolve(false)
        }
      }
      else {
        allowance(this.context.web3.selectedAccount, this.props.position.option.acoToken, acoFlashExerciseAddress()).then(result => {
          var resultValue = new Web3Utils.BN(result)
          resolve(resultValue.lt(this.getOptionAmountToDecimals()))
        })
      }
    })
  }

  sendAllowDeposit = (nonce) => {
    if (this.state.selectedTab === 1) {
      return allowDeposit(this.context.web3.selectedAccount, toDecimals(this.state.payValue, this.getPayDecimals()), getExerciseAddress(this.props.position.option), this.props.position.option.acoToken, nonce)
    }
    else {
      return allowDeposit(this.context.web3.selectedAccount, this.getOptionAmountToDecimals().toString(), this.props.position.option.acoToken, acoFlashExerciseAddress(), nonce)
    }
  }

  sendExercise = (nonce) => {
    if (this.state.selectedTab === 1) {
      return exercise(this.context.web3.selectedAccount, this.props.position.option, this.getOptionAmountToDecimals().toString(), toDecimals(this.state.payValue, this.getPayDecimals()), nonce)
    }
    else {
      return flashExercise(this.context.web3.selectedAccount, this.props.position.option.acoToken, this.getOptionAmountToDecimals().toString(), this.getMinimumReceivedAmountToDecimals().toString(), nonce)
    }
  }

  getOptionAmountToDecimals = () => {
    return toDecimals(this.state.optionsAmount, this.props.position.option.underlyingInfo.decimals)
  }

  getMinimumReceivedAmountToDecimals = () => {
    return toDecimals(this.state.minimumReceivedAmount, getCollateralInfo(this.props.position.option).decimals)
  }

  sendExerciseTransaction = (stepNumber, nonce, needApproval) => {
    this.setStepsModalInfo(++stepNumber, needApproval)
    this.sendExercise()
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
    var title = (needApproval && stepNumber <= 2) ? "Unlock token" : (this.state.selectedTab === 1 ? "Exercise" : "Flash Exercise")
    var subtitle = ""
    var img = null
    var option = this.props.position.option
    var unlockSymbol =  (this.state.selectedTab === 1 ? this.getPaySymbol() : option.acoTokenInfo.symbol)
    if (needApproval && stepNumber === 1) {
      subtitle = "Confirm on " + this.context.web3.name + " to unlock " + unlockSymbol + " for using on Auctus"
      img = <MetamaskLargeIcon />
    }
    else if (needApproval && stepNumber === 2) {
      subtitle = "Unlocking " + unlockSymbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = "Confirm on " + this.context.web3.name + " to send " + this.state.optionsAmount + " " + option.acoTokenInfo.symbol 
      if (this.state.selectedTab === 1) {
        subtitle += " and " + this.formattedPayValue() + " " + this.getPaySymbol() + ", you'll receive " + this.state.collateralValue + " " + this.getReceiveSymbol() + " by exercising."
      }
      else {
        subtitle += " and you'll receive a minimum of " + this.state.minimumReceivedAmount + " " + this.getReceiveSymbol() + " by exercising."
      }
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 4) {
      subtitle = "Exercising " + this.state.optionsAmount + " " + option.acoTokenInfo.symbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 5) {
      subtitle = "You have successfully exercised the options"
      if (this.state.selectedTab === 1) {
        subtitle += " and received " + this.state.collateralValue + " " + this.getReceiveSymbol() + " on your wallet."
      }
      else {
        subtitle += "."
      }
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
    steps.push({ title: "Exercise", progress: stepNumber > 4 ? 100 : 0, active: stepNumber >= 3 ? true : false })
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
    this.props.onHide(true)
  }

  onHideStepsModal = () => {
    this.setState({ stepsModalInfo: null })
  }

  canConfirm = () => {
    return this.state.optionsAmount !== null && this.state.optionsAmount !== "" && this.state.optionsAmount > 0 && !this.isInsufficientFunds() &&
      ((this.state.selectedTab === 1 && !this.isInsufficientFundsToPay()) ||
        (this.state.selectedTab === 2 && this.state.flashAvailable && this.state.minimumReceivedAmount !== null && this.state.minimumReceivedAmount !== "" && this.state.minimumReceivedAmount > 0))
  }

  isInsufficientFunds = () => {
    return this.getOptionAmountToDecimals().gt(new Web3Utils.BN(this.props.position.openPosition))
  }

  getPayDifference = () => {
    return fromDecimals(toDecimals(this.state.payValue, this.getPayDecimals()).sub(new Web3Utils.BN(this.state.payAssetBalance)), this.getPayDecimals(), this.getPayDecimals())
  }

  isInsufficientFundsToPay = () => {
    return toDecimals(this.state.payValue, this.getPayDecimals()).gt(new Web3Utils.BN(this.state.payAssetBalance))
  }

  onMaxClick = () => {
    var balance = getFormattedOpenPositionAmount(this.props.position)
    this.onOptionsAmountChange(balance)
  }

  onOptionsAmountChange = (value) => {
    this.setState({ optionsAmount: value, collateralValue: this.getCollateralValue(value), payValue: this.getPayValue(value), exerciseFee: this.getExerciseFee(value) }, () => this.getEstimatedInfo())
  }

  onMinimumReceivedAmountChange = (value) => {
    this.setState({ minimumReceivedAmount: value })
  }

  getEstimatedInfo = () => {
    getEstimatedReturn(this.props.position.option.acoToken, this.getOptionAmountToDecimals().toString()).then(result => {
      var estimatedReturn = fromDecimals(result, getCollateralInfo(this.props.position.option).decimals)
      this.setState({ estimatedReturn: result, minimumReceivedAmount: formatWithPrecision(estimatedReturn*0.85) })
    })
    getFlashExerciseData(this.props.position.option.acoToken, this.getOptionAmountToDecimals().toString()).then(exerciseData => {
      this.setPriceFromExerciseData(exerciseData)
    })
  }

  setPriceFromExerciseData = (exerciseData) => {
    if (exerciseData && exerciseData["0"] !== "0" && exerciseData["1"] !== "0") {
      var amountRequired = new Web3Utils.BN(exerciseData["0"])
      var expectedAmount = new Web3Utils.BN(exerciseData["1"])
      var precision = new Web3Utils.BN(10).pow(new Web3Utils.BN(this.props.position.option.underlyingInfo.decimals))
      var price = null
      if (this.props.position.option.isCall) {
        price = expectedAmount.mul(precision).div(amountRequired)
      }
      else {
        price = amountRequired.mul(precision).div(expectedAmount)
      }
      this.setState({ estimatedPrice: price })
    }
    else {
      this.setState({ estimatedPrice: null })
    }
  }  

  getTotalCollateralValue = (optionsAmount) => {
    return getCollateralAmount(this.props.position.option, optionsAmount)
  }

  getCollateralValue = (optionsAmount) => {
    var totalCollateralValue = this.getTotalCollateralValue(optionsAmount)
    return totalCollateralValue - this.getExerciseFee(optionsAmount)
  }

  getExerciseFee = (optionsAmount) => {
    var totalCollateralValue = this.getTotalCollateralValue(optionsAmount)
    return (totalCollateralValue * (this.props.position.option.acoFee / PERCENTAGE_PRECISION))
  }

  getPayValue = (optionsAmount) => {
    return getExerciseValue(this.props.position.option, optionsAmount, this.state.maxExercisedAccounts)
  }

  getPaySymbol = () => {
    var option = this.props.position.option
    return getExerciseInfo(option).symbol
  }

  getPayAddress = () => {
    var option = this.props.position.option
    return getExerciseAddress(option)
  }

  getPayDecimals = () => {
    var option = this.props.position.option
    return getExerciseInfo(option).decimals
  }

  isPayEth = () => {
    var option = this.props.position.option
    return isEther(getExerciseAddress(option))
  }

  getReceiveSymbol = () => {
    var option = this.props.position.option
    return getCollateralInfo(option).symbol
  }

  getOptionExerciseDescription = () => {
    var text = "By exercising this option, you can {OPTION_TYPE} {OPTION_ASSET} for {OPTION_STRIKE_PRICE} before {EXPIRY_TIME}."
    return text.replace("{EXPIRY_TIME}", formatDate(this.props.position.option.expiryTime))
      .replace("{OPTION_TYPE}", (this.props.position.option.isCall ? "buy" : "sell"))
      .replace("{OPTION_ASSET}", this.props.position.option.underlyingInfo.symbol)
      .replace("{OPTION_STRIKE_PRICE}", getOptionFormattedPrice(this.props.position.option))
  }

  selectTab = (selectedTab) => () => {
    this.setState({ selectedTab: selectedTab })
  }

  isFlashOutOfMoney = () => {
    return this.state.selectedTab === 2 && this.state.flashAvailable && this.getEstimatedReturnBN().eq(zero)
  }

  isMinimumAboveEstimated = () => {
    return this.state.selectedTab === 2 && this.state.flashAvailable && this.getEstimatedReturnBN().lt(this.getMinimumReceivedAmountToDecimals())
  }

  getEstimatedReturnBN = () => {
    return new Web3Utils.BN(this.state.estimatedReturn)
  }

  getEstimatedReturnFromDecimals = () => {
    return !this.state.estimatedReturn ? "0" : fromDecimals(this.state.estimatedReturn, getCollateralInfo(this.props.position.option).decimals)
  }

  getEstimatedPriceFromDecimals = () => {
    return !this.state.estimatedPrice ? "-" : fromDecimals(this.state.estimatedPrice, this.props.position.option.strikeAssetInfo.decimals)
  }

  getEstimatedPriceSymbol = () => {
    return !this.state.estimatedPrice ? "" : (this.props.position.option.strikeAssetInfo.symbol + "/"+ this.props.position.option.underlyingInfo.symbol)
  }

  formattedPayValue = () => {
    return fromDecimals(toDecimals(this.state.payValue, this.getPayDecimals()), this.getPayDecimals(), 6)
  }

  render() {
    return (<Modal className="aco-modal no-header exercise-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Header closeButton></Modal.Header>
      <Modal.Body>
        <div className="exercise-action">
          {this.state.selectedTab === null && <Loading></Loading>}
          {this.state.selectedTab !== null && <>
          <div className="btn-group pill-button-group">
            <button onClick={this.selectTab(2)} type="button" className={"pill-button " + (this.state.selectedTab === 2 ? "active" : "")}>FLASH EXERCISE</button>
            <button onClick={this.selectTab(1)} type="button" className={"pill-button " + (this.state.selectedTab === 1 ? "active" : "")}>EXERCISE</button>            
          </div>
          <div className="confirm-card">
            <div className="confirm-card-header">{this.props.position.option.acoTokenInfo.symbol}</div>
            <div className={"confirm-card-body " + (this.isInsufficientFunds() ? "insufficient-funds-error" : "")}>
              {this.state.selectedTab === 2 && <>
                <>
                  <div>With Flash Exercise, you can exercise an option using flash swaps of Uniswap V2 and just receive the net profit.</div>
                  <div className="card-separator"></div>
                  {!this.state.flashAvailable && <div>This option doesn't support Flash Exercise.</div>}
                </>
              </>}
              {(this.state.selectedTab === 1 || this.state.flashAvailable) && <>
                <div className="balance-column">
                  <div>Amount available to exercise: <span>{getFormattedOpenPositionAmount(this.props.position)} options</span></div>
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
                {this.state.selectedTab === 1 && (!this.state.optionsAmount || this.state.optionsAmount === "" || this.isInsufficientFunds()) &&
                  <>
                    <div className="card-separator"></div>
                    <div>{this.getOptionExerciseDescription()}</div>
                  </>
                }
              </>}
            </div>
            {(this.state.selectedTab === 1 || this.state.flashAvailable) && this.state.optionsAmount && this.state.optionsAmount !== "" && this.state.optionsAmount > 0 && !this.isInsufficientFunds() &&
              <div className="confirm-card-body highlight-background border-top-separator">
                <div>
                  <div className="summary-title">SUMMARY</div>
                  <table className="aco-table summary-table">
                    <tbody>
                      {this.state.selectedTab === 1 && <>
                        <tr className={this.isInsufficientFundsToPay() ? "insufficient-funds-error" : ""}>
                          <td>You'll {(this.props.position.option.isCall ? "pay" : "send")}</td>
                          <td>{this.formattedPayValue()} {this.getPaySymbol()}</td>
                        </tr>
                        <tr>
                          <td>You'll receive</td>
                          <td>{this.state.collateralValue} {this.getReceiveSymbol()}</td>
                        </tr>
                      </>}
                      {this.state.selectedTab === 2 && <>
                        <tr>
                          <td>Settlement price<span>(estimated)</span></td>
                          <td>{this.getEstimatedPriceFromDecimals()} {this.getEstimatedPriceSymbol()}</td>
                        </tr>
                        <tr>
                          <td>Total profit<span>(estimated)</span></td>
                          <td>{this.getEstimatedReturnFromDecimals()} {this.getReceiveSymbol()}</td>
                        </tr>
                      </>}
                      {this.state.exerciseFee > 0 && <tr>
                        <td>Exercise fee</td>
                        <td>{this.state.exerciseFee} {this.getReceiveSymbol()}</td>
                      </tr>}
                    </tbody>
                  </table>
                  {this.state.selectedTab === 1 && this.isInsufficientFundsToPay() && <>
                  <div className="insufficient-funds-message">You need more {this.getPayDifference()} {this.getPaySymbol()} to exercise {this.state.optionsAmount} options.</div>
                  {!this.isPayEth() && <a className="swap-link" target="_blank" rel="noopener noreferrer" href={swapUrl() + this.getPayAddress()}>Need {this.getPaySymbol()}? Swap ETH for {this.getPaySymbol()}</a>}
                  </>}
                  {this.isFlashOutOfMoney() && 
                    <div className="insufficient-funds-message">This option is currently out of the money according to the estimated Uniswap price, the transaction will most likely fail.</div>
                  }
                </div>
              </div>}
            {(this.state.selectedTab === 1 || this.state.flashAvailable) && this.state.selectedTab === 2 && this.state.optionsAmount && this.state.optionsAmount !== "" && this.state.optionsAmount > 0 && !this.isInsufficientFunds() &&
              <div className={"confirm-card-body " + (this.isInsufficientFunds() ? "insufficient-funds-error" : "")}>
                <div className="input-row">
                  <div className="amount-to-receive">
                    <div className="input-label">Set minimum amount to be received</div>
                    <div className="input-field">
                      <DecimalInput tabIndex="-1" onChange={this.onMinimumReceivedAmountChange} value={this.state.minimumReceivedAmount}></DecimalInput>
                      <div className="coin-symbol">{this.getReceiveSymbol()}</div>
                    </div>
                  </div>
                </div>
                {this.isMinimumAboveEstimated() && 
                  <div className="insufficient-funds-message">The entered minimum amount to be received is above the estimated, the transaction will most likely fail.</div>
                }
              </div>}
              {(this.state.selectedTab === 1 || this.state.flashAvailable) && <div className={"confirm-card-actions " + ((this.state.selectedTab === 1 && this.state.optionsAmount && this.state.optionsAmount !== "" && this.state.optionsAmount > 0 && !this.isInsufficientFunds()) ? "highlight-background" : "")}>
                <div className="aco-button cancel-btn" onClick={() => this.props.onHide(false)}>Go back</div>
                <div className={"aco-button action-btn " + (this.canConfirm() ? "" : "disabled")} onClick={this.onConfirm}>Confirm</div>
              </div>}
            </div>
            </>}
            {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
          </div>
        </Modal.Body>
      </Modal>)
  }
}

ExerciseModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(ExerciseModal)
