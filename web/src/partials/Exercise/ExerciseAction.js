import './ExerciseAction.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { exercise, getOptionFormattedPrice, getFormattedOpenPositionAmount, getBalanceOfExerciseAsset, getExerciseInfo, getCollateralInfo, getTokenStrikePriceRelation, getCollateralAmount } from '../../util/acoTokenMethods'
import { formatDate, fromDecimals, toDecimals, isEther, acoFeePrecision, uniswapUrl } from '../../util/constants'
import { checkTransactionIsMined, getNextNonce } from '../../util/web3Methods'
import Web3Utils from 'web3-utils'
import StepsModal from '../StepsModal/StepsModal'
import DecimalInput from '../Util/DecimalInput'
import { allowDeposit, allowance } from '../../util/erc20Methods'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'

class ExerciseAction extends Component { 
  constructor(props) {
    super(props)    
    this.state = { optionsAmount: "", collateralValue: "", exerciseFee: "", payValue: "", payAssetBalance: ""}
  }

  componentDidMount = () => {
    getBalanceOfExerciseAsset(this.props.position.option, this.context.web3.selectedAccount).then(result => 
      this.setState({payAssetBalance: result})
      )
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair ||
      this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onCancelClick()
    }
  }

  onConfirm = () => {
    if (this.canConfirm()) {
      getNextNonce(this.context.web3.selectedAccount).then(nonce => {
        var stepNumber = 0
        this.needApprove().then(needApproval => {
          if (needApproval) {
            this.setStepsModalInfo(++stepNumber, needApproval)
            allowDeposit(this.context.web3.selectedAccount, toDecimals(this.state.payValue, this.getPayDecimals()), getExerciseInfo(this.props.position.option).address, this.props.position.option.acoToken, nonce)
            .then(result => {
              if (result) {
                this.setStepsModalInfo(++stepNumber, needApproval)
                checkTransactionIsMined(result).then(result => {
                  if(result) {
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
      if (!this.isPayEth()) {
        allowance(this.context.web3.selectedAccount, getExerciseInfo(this.props.position.option).address, this.props.position.option.acoToken).then(result => {
          var resultValue = new Web3Utils.BN(result)
          resolve(resultValue.lt(toDecimals(this.state.payValue, this.getPayDecimals())))
        })
      }
      else {
        resolve(false)
      }
    })    
  }

  sendExerciseTransaction = (stepNumber, nonce, needApproval) => {
    this.setStepsModalInfo(++stepNumber, needApproval)
    exercise(this.context.web3.selectedAccount, this.props.position.option, toDecimals(this.state.optionsAmount, this.props.position.option.underlyingInfo.decimals, nonce).toString())
    .then(result => {
      if (result) {
        this.setStepsModalInfo(++stepNumber, needApproval)
        checkTransactionIsMined(result)
        .then(result => {
          if(result) {
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
    var title = (needApproval && stepNumber <= 2)  ? "Unlock token" : "Exercise"
    var subtitle = ""
    var img = null
    var option = this.props.position.option
    if (needApproval && stepNumber === 1) {
      subtitle =  "Confirm on Metamask to unlock "+this.getPaySymbol()+" for minting on ACO" 
      img = <MetamaskLargeIcon/>
    }
    else if (needApproval && stepNumber === 2) {
      subtitle =  "Unlocking "+this.getPaySymbol()+"..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 3) {
      subtitle =  "Confirm on Metamask to send "+this.state.optionsAmount+" "+option.acoTokenInfo.symbol+" and "+this.state.payValue+" "+this.getPaySymbol()+", you'll receive "+this.state.collateralValue+" "+this.getReceiveSymbol()+" by exercising."
      img = <MetamaskLargeIcon/>
    }
    else if (stepNumber === 4) {
      subtitle =  "Exercising "+this.state.optionsAmount+" "+option.acoTokenInfo.symbol+"..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 5) {
      subtitle = "You have successfully exercised the options and received "+this.state.collateralValue+" "+this.getReceiveSymbol()+" on your wallet."
      img = <DoneLargeIcon/>
    }
    else if (stepNumber === -1) {
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon/>
    }

    var steps = []
    if (needApproval) {
      steps.push({title: "Unlock", progress: stepNumber > 2 ? 100 : 0, active: true})
    }
    steps.push({title: "Exercise", progress: stepNumber > 4 ? 100 : 0, active: stepNumber >= 3 ? true : false})
    this.setState({
      stepsModalInfo: {
        title: title, 
        subtitle: subtitle, 
        steps: steps, 
        img: img, 
        isDone: (stepNumber === 5 || stepNumber === -1), 
        onDoneButtonClick: (stepNumber === 5 ? this.onDoneButtonClick : this.onHideStepsModal)}
    })
  }

  onDoneButtonClick = () => {
    this.props.onCancelClick()
  }

  onHideStepsModal = () => {
    this.setState({stepsModalInfo: null})
  }
  
  canConfirm = () => {
    return this.state.optionsAmount !== null && this.state.optionsAmount !== "" && this.state.optionsAmount > 0 && !this.isInsufficientFunds() && !this.isInsufficientFundsToPay()
  }

  isInsufficientFunds = () => {
    return toDecimals(this.state.optionsAmount, this.props.position.option.underlyingInfo.decimals).gt(new Web3Utils.BN(this.props.position.openPosition))
  }

  getPayDifference = () => {
    return fromDecimals(toDecimals(this.state.payValue, this.getPayDecimals()).sub(new Web3Utils.BN(this.state.payAssetBalance)), this.getPayDecimals())
  }

  isInsufficientFundsToPay = () => {
    return toDecimals(this.state.payValue, this.getPayDecimals()).gt(new Web3Utils.BN(this.state.payAssetBalance))
  }

  onMaxClick = () => {
    var balance = getFormattedOpenPositionAmount(this.props.position)
    this.onOptionsAmountChange(balance)
  }

  onOptionsAmountChange = (value) => {
    this.setState({ optionsAmount: value, collateralValue: this.getCollateralValue(value), payValue:this.getPayValue(value), exerciseFee: this.getExerciseFee(value) })
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
    return (totalCollateralValue * (this.props.position.option.acoFee/acoFeePrecision))
  }

  getPayValue = (optionsAmount) => {
    return this.props.position.option.isCall ? getTokenStrikePriceRelation(this.props.position.option, optionsAmount) : optionsAmount
  }

  getPaySymbol = () => {
    var option = this.props.position.option
    return getExerciseInfo(option).symbol
  }

  getPayAddress = () => {
    var option = this.props.position.option
    return getExerciseInfo(option).address
  }

  getPayDecimals = () => {
    var option = this.props.position.option
    return getExerciseInfo(option).decimals
  }

  isPayEth = () => {
    var option = this.props.position.option
    return isEther(getExerciseInfo(option).address)
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

  render() {
    return <div className="exercise-action">
        <div className="confirm-card">
        <div className="confirm-card-header">{this.props.position.option.acoTokenInfo.symbol}</div>
        <div className={"confirm-card-body "+(this.isInsufficientFunds() ? "insufficient-funds-error" : "")}>
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
          {(!this.state.optionsAmount || this.state.optionsAmount === "" || this.isInsufficientFunds()) && <div className="card-separator"></div>}
          {(!this.state.optionsAmount || this.state.optionsAmount === "" || this.isInsufficientFunds()) && <div>{this.getOptionExerciseDescription()}</div>}
        </div>
        {this.state.optionsAmount && this.state.optionsAmount !== "" && !this.isInsufficientFunds() && 
          <div className="confirm-card-body highlight-background">
            <div>
              <div className="summary-title">SUMMARY</div>
              <table className="summary-table">
                <tbody>
                  <tr className={this.isInsufficientFundsToPay() ? "insufficient-funds-error" : ""}>
                    <td>You'll {(this.props.position.option.isCall ? "pay" : "send")}</td>
                    <td>{this.state.payValue} {this.getPaySymbol()}</td>
                  </tr>
                  <tr>
                    <td>You'll receive</td>
                    <td>{this.state.collateralValue} {this.getReceiveSymbol()}</td>
                  </tr>
                  {this.state.exerciseFee > 0 && <tr>
                    <td>Exercise fee</td>
                    <td>{this.state.exerciseFee} {this.getReceiveSymbol()}</td>
                  </tr>}
                </tbody>
              </table>
              {this.isInsufficientFundsToPay() && <div className="insufficient-funds-message">You need more {this.getPayDifference()} {this.getPaySymbol()} to exercise {this.state.optionsAmount} options.</div>}
              {this.isInsufficientFundsToPay() && <a className="swap-link" target="_blank" rel="noopener noreferrer" href={uniswapUrl+this.getPayAddress()}>Need {this.getPaySymbol()}? Swap ETH for {this.getPaySymbol()}</a>}
            </div>
        </div>}
        <div className={"confirm-card-actions " + ((this.state.optionsAmount && this.state.optionsAmount !== "" && !this.isInsufficientFunds()) ? "highlight-background" : "")}>
          <div className="aco-button cancel-btn" onClick={this.props.onCancelClick}>Cancel</div>
          <div className={"aco-button action-btn "+(this.canConfirm() ? "" : "disabled")} onClick={this.onConfirm}>Confirm</div>
        </div>
      </div>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
      </div>
  }
}

ExerciseAction.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(ExerciseAction)