import './WriteStep3.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import DecimalInput from '../Util/DecimalInput'
import { uniswapUrl, formatDate, fromDecimals, toDecimals, ethTransactionTolerance, isEther, zero } from '../../util/constants'
import { getBalanceOfCollateralAsset, mint, getCollateralInfo, getTokenAmount, getOptionFormattedPrice, getCollateralAmount, getCollateralAddress } from '../../util/acoTokenMethods'
import { checkTransactionIsMined, getNextNonce } from '../../util/web3Methods'
import Web3Utils from 'web3-utils'
import StepsModal from '../StepsModal/StepsModal'
import { allowDeposit, allowance } from '../../util/erc20Methods'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'

class WriteStep3 extends Component {
  constructor() {
    super()
    this.state = { collaterizeValue: "", optionsAmount: "", collateralBalance: null }
  }

  componentDidMount = () => {
    getBalanceOfCollateralAsset(this.props.option, this.context.web3.selectedAccount).then(result => 
      this.setState({collateralBalance: result})
      )
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair || 
      this.props.optionType !== prevProps.optionType) {
        this.props.onCancelClick()
    }
    else if (this.props.accountToggle !== prevProps.accountToggle) {
      this.componentDidMount()
    }
  }

  onCollaterizeChange = (value) => {
    this.setState({ collaterizeValue: value, optionsAmount: this.getOptionsAmount(value) })
  }

  onMaxClick = () => {
    var tolerance = this.isCollateralEth() ? Web3Utils.toBN(ethTransactionTolerance * Math.pow(10, this.getCollateralDecimals())) : zero
    var balance = fromDecimals((this.state.collateralBalance > tolerance) ? (this.state.collateralBalance.sub(tolerance)) : zero, this.getCollateralDecimals())
    this.onCollaterizeChange(balance)
  }

  getOptionsAmount = (collaterizeValue) => {
    return this.props.option.isCall ? collaterizeValue : this.getOptionsAmountForPut(collaterizeValue)
  }

  getOptionsAmountForPut = (collaterizeValue) => {
    return getTokenAmount(this.props.option, collaterizeValue)
  }

  getCollaterizeValue = (optionsAmount) => {
    return this.props.option.isCall ? optionsAmount : this.getCollaterizeValueForPut(optionsAmount)
  }

  getCollaterizeValueForPut = (optionsAmount) => {
    return getCollateralAmount(this.props.option, optionsAmount)
  }

  getCollateralDecimals = () => {
    return getCollateralInfo(this.props.option).decimals
  }

  onOptionsAmountChange = (value) => {
    this.setState({ optionsAmount: value, collaterizeValue: this.getCollaterizeValue(value) })
  }

  getOptionConfirmationText = () => {
    var text = "After transferring or selling the minted options, at any time before {EXPIRY_TIME}, if you get assigned, you will be forced to {OPTION_TYPE} {OPTION_ASSET} for {OPTION_STRIKE_PRICE} per option."
    return text.replace("{EXPIRY_TIME}", formatDate(this.props.option.expiryTime))
      .replace("{OPTION_TYPE}", (!this.props.option.isCall ? "buy" : "sell"))
      .replace("{OPTION_ASSET}", this.props.option.underlyingInfo.symbol)
      .replace("{OPTION_STRIKE_PRICE}", getOptionFormattedPrice(this.props.option))
  }

  getCollaterizeAssetSymbol = () => {
    return getCollateralInfo(this.props.option).symbol
  }

  getCollaterizeAssetAddress = () => {
    return getCollateralAddress(this.props.option)
  }

  isCollateralEth = () => {
    return isEther(this.getCollaterizeAssetAddress())
  }

  onConfirm = () => {
    if (this.canConfirm()) {
      getNextNonce(this.context.web3.selectedAccount).then(nonce => {
        var stepNumber = 0
        this.needApprove().then(needApproval => {
        if (needApproval) {
          this.setStepsModalInfo(++stepNumber, needApproval)
          allowDeposit(this.context.web3.selectedAccount, toDecimals(this.state.collaterizeValue, this.getCollateralDecimals()), getCollateralAddress(this.props.option), this.props.option.acoToken, nonce)
          .then(result => {
            if (result) {
              this.setStepsModalInfo(++stepNumber, needApproval)
              checkTransactionIsMined(result).then(result => {
                if(result) {
                  this.sendMintTransaction(stepNumber, ++nonce, needApproval)
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
          this.sendMintTransaction(stepNumber, nonce, needApproval)
        }})
      })
    }
  }

  needApprove = () => {
    return new Promise((resolve) => {
      if (!this.isCollateralEth()) {
        allowance(this.context.web3.selectedAccount, getCollateralAddress(this.props.option), this.props.option.acoToken).then(result => {
          var resultValue = new Web3Utils.BN(result)
          resolve(resultValue.lt(toDecimals(this.state.collaterizeValue, this.getCollateralDecimals())))
        })
      }
      else {
        resolve(false)
      }
    })    
  }

  sendMintTransaction = (stepNumber, nonce, needApproval) => {
    this.setStepsModalInfo(++stepNumber, needApproval)
    mint(this.context.web3.selectedAccount, this.props.option, toDecimals(this.state.collaterizeValue, this.getCollateralDecimals()).toString(), nonce)
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

  setStepsModalInfo = (stepNumber, needApprove) => {
    var title = (needApprove && stepNumber <= 2)  ? "Unlock token" : "Mint"
    var subtitle = ""
    var img = null
    if (needApprove && stepNumber === 1) {
      subtitle =  "Confirm on Metamask to unlock "+this.getCollaterizeAssetSymbol()+" for minting on ACO" 
      img = <MetamaskLargeIcon/>
    }
    else if (needApprove && stepNumber === 2) {
      subtitle =  "Unlocking "+this.getCollaterizeAssetSymbol()+"..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 3) {
      subtitle =  "Confirm on Metamask to mint "+this.state.optionsAmount+" "+this.props.option.acoTokenInfo.symbol
      img = <MetamaskLargeIcon/>
    }
    else if (stepNumber === 4) {
      subtitle =  "Minting "+this.state.optionsAmount+" "+this.props.option.acoTokenInfo.symbol+"..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 5) {
      subtitle = "You have successfully minted "+this.state.optionsAmount+" "+this.props.option.acoTokenInfo.symbol+", access Trade if you want to sell them"
      img = <DoneLargeIcon/>
    }
    else if (stepNumber === -1) {
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon/>
    }

    var steps = []
    if (needApprove) {
      steps.push({title: "Unlock", progress: stepNumber > 2 ? 100 : 0, active: true})
    }
    steps.push({title: "Mint", progress: stepNumber > 4 ? 100 : 0, active: stepNumber >= 3 ? true : false})
    this.setState({
      stepsModalInfo: {
        title: title, 
        subtitle: subtitle, 
        steps: steps, 
        img: img, 
        isDone: (stepNumber === 5 || stepNumber === -1), 
        doneLabel:(stepNumber === 5 ? "TRADE" : "OK"), 
        onDoneButtonClick: (stepNumber === 5 ? this.onDoneButtonClick : this.onHideStepsModal)}
    })
  }

  onDoneButtonClick = () => {
    this.props.history.push('/advanced/trade/'+ this.props.selectedPair.id + "/" + this.props.option.acoToken)
  }

  onHideStepsModal = () => {
    this.setState({stepsModalInfo: null})
  }

  isInsufficientFunds = () => {
    return this.state.collateralBalance !== null && this.state.collateralBalance.lt(toDecimals(this.state.collaterizeValue, this.getCollateralDecimals()))
  }

  canConfirm = () => {
    return this.state.optionsAmount !== null && this.state.optionsAmount !== "" && !this.isInsufficientFunds()
  }

  render() {
    return <div className="write-step3">
      <div className="page-subtitle">Summary</div>
      <div className="confirm-card">
        <div className="confirm-card-header">{this.props.option.acoTokenInfo.symbol}</div>
        <div className={"confirm-card-body "+(this.isInsufficientFunds() ? "insufficient-funds-error" : "")}>
          <div className="input-row">
            <div className="input-column">
              <div className="input-label">{this.getCollaterizeAssetSymbol()} to collaterize</div>
              <div className="input-field">
                <DecimalInput tabIndex="-1" onChange={this.onCollaterizeChange} value={this.state.collaterizeValue}></DecimalInput>
                <div className="max-btn" onClick={this.onMaxClick}>MAX</div>
              </div>
            </div>
            <div className="equal-symbol">=</div>
            <div className="input-column">
              <div className="input-label">Amount of options to mint</div>
              <div className="input-field">
                <DecimalInput tabIndex="-1" onChange={this.onOptionsAmountChange} value={this.state.optionsAmount}></DecimalInput>
              </div>
            </div>
          </div>
          <div className="balance-row">
            <div className="balance-info">Balance: {this.state.collateralBalance ? (fromDecimals(this.state.collateralBalance.toString(), this.getCollateralDecimals(), 2) + " " + this.getCollaterizeAssetSymbol()) : ""}</div>
            <div className="swap-link-wrapper">{this.isInsufficientFunds() && !this.isCollateralEth() && <a className="swap-link" target="_blank" rel="noopener noreferrer" href={uniswapUrl+this.getCollaterizeAssetAddress()}>Need {this.getCollaterizeAssetSymbol()}? Swap ETH for {this.getCollaterizeAssetSymbol()}</a>}</div>
          </div>
          <div className="card-separator"></div>
          <div>
            {this.getOptionConfirmationText()}
          </div>
        </div>
        <div className="confirm-card-actions">
          <div className="aco-button cancel-btn" onClick={this.props.onCancelClick}>Cancel</div>
          <div className={"aco-button action-btn "+(this.canConfirm() ? "" : "disabled")} onClick={this.onConfirm}>Confirm</div>
        </div>
      </div>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
    </div>
  }
}

WriteStep3.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(WriteStep3)