import './SimpleWriteStep2.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { fromDecimals, isBaseAsset, ethTransactionTolerance, toDecimals, maxAllowance, zero, formatPercentage, formatDate, formatWithPrecision } from '../../util/constants'
import { getCollateralInfo, getBalanceOfCollateralAsset, getTokenAmount, getCollateralAddress, getOptionFormattedPrice, getCollateralAmount } from '../../util/contractHelpers/acoTokenMethods'
import Web3Utils from 'web3-utils'
import DecimalInput from '../Util/DecimalInput'
import StepsModal from '../StepsModal/StepsModal'
import { getNextNonce, checkTransactionIsMined } from '../../util/web3Methods'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import { allowDeposit, allowance } from '../../util/contractHelpers/erc20Methods'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { getDeribiData } from '../../util/baseApi'
import VerifyModal from '../VerifyModal'
import { getQuote } from '../../util/acoSwapUtil'
import { write } from '../../util/contractHelpers/acoWriterV2Methods'
import { acoWriterAddress } from '../../util/network'

class SimpleWriteStep2 extends Component {
  constructor(props) {
    super(props)
    this.state = {swapQuote: null, collateralBalance: null, collaterizeValue: null}
  }

  componentDidMount = () => {
    this.refreshAccountBalance()
    this.setState({collaterizeValue: getCollateralAmount(this.props.option, 1)}, this.refresh)
    this.startQuoteRefresh()
  }
  
  componentWillUnmount = () => {
    this.stopQuoteRefresh()  
  }

  stopQuoteRefresh = () => {
    clearTimeout(this.quoteTimeout)
    this.quoteTimeout = null
  }

  quoteTimeout = null
  startQuoteRefresh = () => {
    this.quoteTimeout = setTimeout(() => {
      if (this.quoteTimeout) {
        this.internalRefreshSwapQuote(this.startQuoteRefresh)
      }
    }, 60000)
  }

  refreshAccountBalance = () => {
    if (this.context.web3.selectedAccount) {
      getBalanceOfCollateralAsset(this.props.option, this.context.web3.selectedAccount)
      .then(result => this.setState({collateralBalance: result}))
    }
    else {
      this.setState({collateralBalance: null})
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.accountToggle !== prevProps.accountToggle) {
      this.refreshAccountBalance()
    }
  }

  getCollaterizeAssetSymbol = () => {
    return getCollateralInfo(this.props.option).symbol
  }

  getCollaterizeAssetAddress = () => {
    return getCollateralAddress(this.props.option)
  }

  getCollateralDecimals = () => {
    return getCollateralInfo(this.props.option).decimals
  }

  isCollateralEth = () => {
    return isBaseAsset(this.getCollaterizeAssetAddress())
  }

  onCollaterizeChange = (value) => {
    this.setState({ collaterizeValue: value }, this.refresh)
  }

  onMaxClick = () => {
    var tolerance = this.isCollateralEth() ? Web3Utils.toBN(ethTransactionTolerance * new Web3Utils.BN(10).pow(new Web3Utils.BN(this.getCollateralDecimals()))) : zero
    var balance = fromDecimals((this.state.collateralBalance > tolerance) ? (this.state.collateralBalance.sub(tolerance)) : zero, this.getCollateralDecimals())
    this.onCollaterizeChange(balance)
  }

  getOptionsAmount = () => {
    return this.props.option.isCall ? this.state.collaterizeValue : this.getOptionsAmountForPut()
  }

  getOptionsAmountForPut = () => {
    return getTokenAmount(this.props.option, this.state.collaterizeValue)
  }

  onWriteClick = () => {
    if (this.canWrite()) {
      getNextNonce(this.context.web3.selectedAccount).then(nonce => {
        var stepNumber = 0
        this.needApprove().then(needApproval => {
          if (needApproval) {
            this.setStepsModalInfo(++stepNumber, needApproval)
            allowDeposit(this.context.web3.selectedAccount, maxAllowance, this.getCollaterizeAssetAddress(), acoWriterAddress(), nonce)
              .then(result => {
                if (result) {
                  this.setStepsModalInfo(++stepNumber, needApproval)
                  checkTransactionIsMined(result).then(result => {
                    if (result) {
                      this.checkQuote(stepNumber, ++nonce, needApproval)
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
            this.checkQuote(stepNumber, nonce, needApproval)
          }
        })
      })
    }
  }

  checkQuote = (stepNumber, nonce, needApproval) => {
    this.stopQuoteRefresh()
    this.setStepsModalInfo(++stepNumber, needApproval)
    var previousQuote = this.state.swapQuote
    this.showVerifyQuote(() => {
        this.refreshSwapQuote(() => {
          if (previousQuote && this.state.swapQuote && previousQuote.price.toString(10) === this.state.swapQuote.price.toString(10)) {
            this.setState({verifyModalInfo: null})            
            this.sendWriteTransaction(stepNumber, nonce, needApproval)
          }
          else {
            var verifyModalInfo = this.state.verifyModalInfo
            verifyModalInfo.timedOut = true
            this.setState({verifyModalInfo: verifyModalInfo})
          }
        })
    })
  }

  showVerifyQuote = (callback) => {
    var verifyModalInfo = {}
    var onCancel = () => this.setState({verifyModalInfo: null}, this.onHideStepsModal)
    verifyModalInfo.onConfirm = callback
    verifyModalInfo.onCancel = onCancel
    verifyModalInfo.onRefresh = () => {
      this.refreshSwapQuote()
      onCancel()
    }    
    verifyModalInfo.swapQuote = this.state.swapQuote
    verifyModalInfo.timedOut = false
    verifyModalInfo.option = this.props.option
    verifyModalInfo.description = this.getSummaryDescription()
    this.setState({verifyModalInfo: verifyModalInfo})
  }

  sendWriteTransaction = (stepNumber, nonce, needApproval) => {
    this.setStepsModalInfo(++stepNumber, needApproval)    
    write(this.context.web3.selectedAccount, this.props.option, this.state.swapQuote.zrxData, nonce)
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
    var title = (stepNumber <= 2)  ? "Unlock token" : (stepNumber < 3 ? "Verify" : "Write")
    var subtitle = ""
    var img = null
    var optionsAmount = this.getOptionsAmount()
    if (stepNumber === 1) {
      subtitle =  "Confirm on " + this.context.web3.name + " to unlock "+this.getCollaterizeAssetSymbol()+" for writing on Auctus" 
      img = <MetamaskLargeIcon/>
    }
    else if (stepNumber === 2) {
      subtitle =  "Unlocking "+this.getCollaterizeAssetSymbol()+"..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 3) {
      subtitle =  "Verifying..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 4) {
      subtitle =  "Confirm on " + this.context.web3.name + " to write "+optionsAmount+" "+this.props.option.acoTokenInfo.symbol
      img = <MetamaskLargeIcon/>
    }
    else if (stepNumber === 5) {
      subtitle =  "Writing "+optionsAmount+" "+this.props.option.acoTokenInfo.symbol+"..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 6) {
      subtitle = "You have successfully written "+optionsAmount+" "+this.props.option.acoTokenInfo.symbol+"."
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
    steps.push({title: "Verify", progress: stepNumber > 3 ? 100 : 0, active: stepNumber >= 3 ? true : false})
    steps.push({title: "Write", progress: stepNumber > 5 ? 100 : 0, active: stepNumber >= 4 ? true : false})
    this.setState({
      stepsModalInfo: {
        title: title, 
        subtitle: subtitle, 
        steps: steps, 
        img: img, 
        isDone: (stepNumber === 6 || stepNumber === -1),
        success: (stepNumber === 6), 
        doneLabel:"OK", 
        onDoneButtonClick: (this.onHideStepsModal)}
    })
  } 

  onHideStepsModal = () => {
    let redirect = (this.props.selectedPair && this.state.stepsModalInfo && this.state.stepsModalInfo.success)
    this.setState({ stepsModalInfo: null, collaterizeValue: "" }, () => {
      this.refresh()
      if (redirect) {
        this.props.refreshWrite()
        var self = this
        setTimeout(() => {
          self.props.history.push('/manage/'+this.props.selectedPair.id)
        }, 300)
      }
    })
  }

  isInsufficientFunds = () => {
    return this.state.collateralBalance !== null && this.state.collateralBalance.lt(toDecimals(this.state.collaterizeValue, this.getCollateralDecimals()))
  }

  canConfirm = () => {
    return this.state.collaterizeValue !== null && this.state.collaterizeValue !== "" && !this.isInsufficientFunds()
  }

  needApprove = () => {
    return new Promise((resolve) => {
      if (!this.isCollateralEth()) {
        allowance(this.context.web3.selectedAccount, getCollateralAddress(this.props.option), acoWriterAddress()).then(result => {
          var resultValue = new Web3Utils.BN(result)
          resolve(resultValue.lt(toDecimals(this.state.collaterizeValue, this.getCollateralDecimals())))
        })
      }
      else {
        resolve(false)
      }
    })    
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  getButtonMessage = () => {
    if (!this.state.collaterizeValue || this.state.collaterizeValue <= 0) {
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

  canWrite = () => {
    return (!this.state.loadingSwap && this.getButtonMessage() === null) 
  }

  refresh = () => {
    this.setDeribitPrice()
    this.refreshSwapQuote()    
  }

  setDeribitPrice = () => {
    var selectedOption = this.props.option
    if (selectedOption) {
      getDeribiData(selectedOption).then((r) => {
        if (r) {
          this.setState({deribitPrice: r.best_bid_price * r.underlying_price})
        } else {
          this.setState({deribitPrice: null})
        }
      }).catch((e) => {
        this.setState({deribitPrice: null})
      })
    } else {
      this.setState({deribitPrice: null})
    }
  }
  
  refreshSwapQuote = (callback) => {
    this.setState({swapQuote: null, errorMessage: null, loadingSwap: true}, () => {
      this.internalRefreshSwapQuote(callback)
    })
  }

  internalRefreshSwapQuote = (callback) => {
    var optionsAmount = this.getOptionsAmount()
    var selectedOption = this.props.option
    if (selectedOption && optionsAmount && optionsAmount > 0) {
      getQuote(false, selectedOption, optionsAmount).then(swapQuote => {
        this.props.setSwapQuoteReturns(selectedOption, swapQuote)
        this.setState({swapQuote: swapQuote, errorMessage: null, loadingSwap: false}, callback)
      }).catch((err) => {
        if (err.message === "Insufficient liquidity") {
          this.setState({swapQuote: null, errorMessage: "Insufficient liquidity", loadingSwap: false}, callback)
        }
        else {
          this.setState({swapQuote: null, errorMessage: "Exchange unavailable", loadingSwap: false}, callback)
        }
      })
    }
    else {
      this.setState({swapQuote: null, errorMessage: null, loadingSwap: false}, callback)
    }
  }


  getOptionPremium = () => {
    var option = this.props.option
    if (option && this.state.swapQuote) {
      return formatWithPrecision(this.getAcoOptionPrice() * this.getOptionsAmount()) + " " + this.props.selectedPair.strikeAssetSymbol
    }
    return "-"
  }

  getFormattedReturnIfFlat = () => {
    var option = this.props.option
    if (option && this.state.swapQuote && this.state.swapQuote.returnIfFlat) {
      return formatPercentage(this.state.swapQuote.returnIfFlat)
    }
    return "-"
  }

  getFormattedOptionsAmount = () => {
    var option = this.props.option
    var optionsAmount = this.getOptionsAmount()
    if (option && optionsAmount) {
      return optionsAmount
    }
    return "-"
  }

  getFormattedAnnualizedReturn = () => {
    var option = this.props.option
    if (option && this.state.swapQuote && this.state.swapQuote.annualizedReturn) {
      return formatPercentage(this.state.swapQuote.annualizedReturn)
    }
    return "-"
  }

  getStrikePrice = () => {
    var option = this.props.option
    return parseFloat(fromDecimals(option.strikePrice, option.strikeAssetInfo.decimals))
  }

  getExpiration = () => {
    var option = this.props.option
    return formatDate(option.expiryTime, true)
  }

  getAcoOptionPrice = () => {    
    if (this.state.swapQuote) {
      return parseFloat(fromDecimals(this.state.swapQuote.price.toString(10), this.props.option.strikeAssetInfo.decimals, this.props.option.strikeAssetInfo.decimals, this.props.option.strikeAssetInfo.decimals))
    }
    return null
  }

  formatPrice = (price) => {
    if (price) {
      return "$" + formatWithPrecision(price)
    }
    return "-"
  }

  getSummaryDescription = () => {
    return <>Receive {this.getOptionPremium()} in return for assuming the obligation to {this.props.option.isCall ? "sell" : "buy"} {this.getFormattedOptionsAmount()} {this.props.option.underlyingInfo.symbol} for {getOptionFormattedPrice(this.props.option)} each until {formatDate(this.props.option.expiryTime)}.</>
  }

  render() {
    return <div className="simple-write-step2">
      <div className="collateral-input">
        <div className="collateral-label">{this.getCollaterizeAssetSymbol()} collateral</div>
        <DecimalInput placeholder="0.0000" tabIndex="-1" onChange={this.onCollaterizeChange} value={this.state.collaterizeValue}></DecimalInput>
        <div className="max-and-balance">
          <div className="max-btn" onClick={this.onMaxClick}>MAX</div>
          <div className="balance"><b>Balance: </b>{this.state.collateralBalance ? (fromDecimals(this.state.collateralBalance.toString(), this.getCollateralDecimals(), 2) + " " + this.getCollaterizeAssetSymbol()) : "-"}</div>
        </div>
      </div>
      <div className="chart-and-summary">
        <div className="summary-wrapper">
          <div className="summary-title-wrapper">
            <div className="summary-title">SUMMARY</div>
            {this.canWrite() && <><div className="summary-separator"></div>
            <div className="summary-description">{this.getSummaryDescription()}</div></>}
          </div>
          <div className="summary-content">
            <div className="summary-items">
              <div className="summary-item summary-highlight">
                <div className="summary-item-label">Premiums to earn</div>
                <div className="summary-item-value">{this.getOptionPremium()}</div>
              </div>
              <div className="summary-item summary-highlight">
                <div className="summary-item-label">Annualized return</div>
                <div className="summary-item-value">{this.getFormattedAnnualizedReturn()}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-label">Return if flat</div>
                <div className="summary-item-value">{this.getFormattedReturnIfFlat()}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-label">Amount of options to be sold</div>
                <div className="summary-item-value">{this.getFormattedOptionsAmount()}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-label">Strike price</div>
                <div className="summary-item-value">{getOptionFormattedPrice(this.props.option)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-label">Expiration</div>
                <div className="summary-item-value">{this.getExpiration()}</div>
              </div>
            </div>
            <div className="similar-prices">
              <div className="ref-label">REF</div>
              <div className="similar-label">(similar options)</div>
              <div className="price-value"><div className="price-origin">Auctus:</div><div>{this.formatPrice(this.getAcoOptionPrice())}</div></div>
              <div className="price-value"><div className="price-origin">Deribit:</div><div>{this.formatPrice(this.state.deribitPrice)}</div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="action-button-wrapper">
        {this.canWrite() ?
          (this.props.isConnected ? 
            <div className="action-btn medium solid-blue" onClick={this.onWriteClick}>
              <div>WRITE</div>
            </div> :
            <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
              <div>CONNECT WALLET</div>
            </div>) :
          <div className="action-btn medium solid-blue disabled">
            <div>{this.state.loadingSwap ? "Loading..." : this.getButtonMessage()}</div>
          </div>}
      </div>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
      {this.state.verifyModalInfo && <VerifyModal {...this.state.verifyModalInfo} />}
    </div>
  }
}

SimpleWriteStep2.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(SimpleWriteStep2)