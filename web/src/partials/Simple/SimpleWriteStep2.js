import './SimpleWriteStep2.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { fromDecimals, isEther, ethTransactionTolerance, toDecimals, maxAllowance, acoWriteAddress, zero, formatPercentage, formatDate, formatWithPrecision } from '../../util/constants'
import { getCollateralInfo, getBalanceOfCollateralAsset, getTokenAmount, getCollateralAddress, getOptionFormattedPrice } from '../../util/acoTokenMethods'
import { getSwapQuote, isInsufficientLiquidity } from '../../util/zrxApi'
import Web3Utils from 'web3-utils'
import DecimalInput from '../Util/DecimalInput'
import StepsModal from '../StepsModal/StepsModal'
import OptionChart from '../OptionChart'
import { getNextNonce, checkTransactionIsMined } from '../../util/web3Methods'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import { allowDeposit, allowance } from '../../util/erc20Methods'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { write } from '../../util/acoWriteMethods'
import { getDeribiData, getOpynQuote } from '../../util/acoApi'

class SimpleWriteStep2 extends Component {
  constructor(props) {
    super(props)
    this.state = {swapQuote: null, collateralBalance: null, collaterizeValue: null}
  }

  componentDidMount = () => {
    if (this.context.web3.selectedAccount) {
      getBalanceOfCollateralAsset(this.props.option, this.context.web3.selectedAccount)
      .then(result => this.setState({collateralBalance: result}))
    }
    else {
      this.setState({collateralBalance: null})
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.componentDidMount()
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
    return isEther(this.getCollaterizeAssetAddress())
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
            allowDeposit(this.context.web3.selectedAccount, maxAllowance, this.getCollaterizeAssetAddress(), acoWriteAddress, nonce)
              .then(result => {
                if (result) {
                  this.setStepsModalInfo(++stepNumber, needApproval)
                  checkTransactionIsMined(result).then(result => {
                    if (result) {
                      this.sendWriteTransaction(stepNumber, ++nonce, needApproval)
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
            this.sendWriteTransaction(stepNumber, nonce, needApproval)
          }
        })
      })
    }
  }

  getWriteValue = (collateral) => {
    if (this.isCollateralEth()) {
      return Web3Utils.toBN(this.state.swapQuote.value).add(collateral).toString()
    }
    return this.state.swapQuote.value
  }

  sendWriteTransaction = (stepNumber, nonce, needApproval) => {
    var collateral = toDecimals(this.state.collaterizeValue, this.getCollateralDecimals())
    var writeValue = this.getWriteValue(collateral)

    this.setStepsModalInfo(++stepNumber, needApproval)
    write(this.context.web3.selectedAccount, this.props.option.acoToken, collateral.toString(), this.state.swapQuote.to, this.state.swapQuote.data, writeValue, this.state.swapQuote.gasPrice, nonce)
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
    var title = (needApprove && stepNumber <= 2)  ? "Unlock token" : "Write"
    var subtitle = ""
    var img = null
    var optionsAmount = this.getOptionsAmount()
    if (needApprove && stepNumber === 1) {
      subtitle =  "Confirm on Metamask to unlock "+this.getCollaterizeAssetSymbol()+" for writing on ACO" 
      img = <MetamaskLargeIcon/>
    }
    else if (needApprove && stepNumber === 2) {
      subtitle =  "Unlocking "+this.getCollaterizeAssetSymbol()+"..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 3) {
      subtitle =  "Confirm on Metamask to write "+optionsAmount+" "+this.props.option.acoTokenInfo.symbol
      img = <MetamaskLargeIcon/>
    }
    else if (stepNumber === 4) {
      subtitle =  "Writing "+optionsAmount+" "+this.props.option.acoTokenInfo.symbol+"..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 5) {
      subtitle = "You have successfully writed "+optionsAmount+" "+this.props.option.acoTokenInfo.symbol+", access Trade if you want to sell them"
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
    steps.push({title: "Write", progress: stepNumber > 4 ? 100 : 0, active: stepNumber >= 3 ? true : false})
    this.setState({
      stepsModalInfo: {
        title: title, 
        subtitle: subtitle, 
        steps: steps, 
        img: img, 
        isDone: (stepNumber === 5 || stepNumber === -1), 
        doneLabel:"OK", 
        onDoneButtonClick: (this.onHideStepsModal)}
    })
  } 

  onHideStepsModal = () => {
    this.setState({ stepsModalInfo: null })
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

  getSwapPrice = () => {
    if (this.state.swapQuote) {
      return this.state.swapQuote.price
    }
    return null
  }

  refresh = () => {
    this.setOpynPrice()
    this.setDeribitPrice()
    this.refreshSwapQuote()    
  }

  setDeribitPrice = () => {
    var selectedOption = this.props.option
    if (selectedOption) {
      getDeribiData(selectedOption).then((r) => {
        if (r) {
          this.setState({deribitPrice: r.best_ask_price})
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

  setOpynPrice = () => {
    var selectedOption = this.props.option
    var optionsAmount = this.getOptionsAmount()
    if (selectedOption && optionsAmount && optionsAmount > 0) {
      getOpynQuote(selectedOption, true, toDecimals(optionsAmount, selectedOption.acoTokenInfo.decimals).toString()).then((r) => this.setState({opynPrice: r})).catch((e) => {
        this.setState({opynPrice: null})
      })
    } else {
      this.setState({opynPrice: null})
    }
  }
  
  refreshSwapQuote = () => {
    this.setState({swapQuote: null, errorMessage: null, loadingSwap: true}, () => {
      var optionsAmount = this.getOptionsAmount()
      var selectedOption = this.props.option
      if (selectedOption && optionsAmount && optionsAmount > 0) {
        getSwapQuote(selectedOption.strikeAsset, selectedOption.acoToken, toDecimals(optionsAmount, selectedOption.acoTokenInfo.decimals).toString(), false).then(swapQuote => {
          this.props.setSwapQuoteReturns(selectedOption, swapQuote)
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


  getOptionPremium = () => {
    var option = this.props.option
    if (option && this.state.swapQuote) {
      return formatWithPrecision((this.state.swapQuote.price) * this.getOptionsAmount()) + " " + this.props.selectedPair.strikeAssetSymbol
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
      return parseFloat(this.state.swapQuote.price)
    }
    return null
  }

  formatAcoPrice = (optionPrice) => {
    if (optionPrice) {
      return formatWithPrecision(optionPrice) + " " + this.props.selectedPair.strikeAssetSymbol
    }
    return "-"
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
        <div className="write-chart-wrapper">
          <OptionChart isCall={this.props.option.isCall} isBuy={false} strikePrice={parseFloat(fromDecimals(this.props.option.strikePrice, this.props.option.strikeAssetInfo.decimals))} optionPrice={this.getSwapPrice()} quantity={this.getOptionsAmount()}/>
        </div>
        <div className="summary-wrapper">
          <div className="summary-title">SUMMARY</div>
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
              <div className="price-value"><div className="price-origin">ACO:</div><div>{this.formatAcoPrice(this.getAcoOptionPrice())}</div></div>
              <div className="price-value"><div className="price-origin">Opyn:</div><div>{this.props.option && this.state.opynPrice ? fromDecimals(this.state.opynPrice, this.props.option.strikeAssetInfo.decimals) : "-"}</div></div>
              <div className="price-value"><div className="price-origin">Deribit:</div><div>{this.props.option && this.state.deribitPrice ? fromDecimals(this.state.deribitPrice, this.props.option.strikeAssetInfo.decimals) : "-"}</div></div>
            </div>
          </div>
        </div>
      </div>
      <div className="action-button-wrapper">
        {this.canWrite() ?
          (this.props.isConnected ? 
            <div className="home-btn medium solid-green" onClick={this.onWriteClick}>
              <div>WRITE</div>
            </div> :
            <div className="home-btn medium solid-green" onClick={this.onConnectClick}>
              <div>CONNECT ACCOUNT</div>
            </div>) :
          <div className="home-btn medium solid-green disabled">
            <div>{this.state.loadingSwap ? "Loading..." : this.getButtonMessage()}</div>
          </div>}
      </div>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
    </div>
  }
}

SimpleWriteStep2.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(SimpleWriteStep2)