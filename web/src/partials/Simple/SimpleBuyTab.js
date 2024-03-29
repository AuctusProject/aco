import './SimpleBuyTab.css'
import React, { Component } from 'react'
import { NavLink, withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import DecimalInput from '../Util/DecimalInput'
import OptionBadge from '../OptionBadge'
import SimpleDropdown from '../SimpleDropdown'
import { formatDate, groupBy, fromDecimals, formatWithPrecision, toDecimals, isBaseAsset, maxAllowance, formatPercentage, DEFAULT_SLIPPAGE, getBalanceOfAsset, sortBy } from '../../util/constants'
import { getOptionFormattedPrice } from '../../util/contractHelpers/acoTokenMethods'
import OptionChart from '../OptionChart'
import Web3Utils from 'web3-utils'
import { checkTransactionIsMined, getNextNonce } from '../../util/web3Methods'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { allowDeposit, allowance } from '../../util/contractHelpers/erc20Methods'
import { getDeribiData } from '../../util/baseApi'
import StepsModal from '../StepsModal/StepsModal'
import VerifyModal from '../VerifyModal'
import BigNumber from 'bignumber.js'
import SlippageModal from '../SlippageModal'
import { faInfoCircle, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
import ReactTooltip from 'react-tooltip'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { buy, getQuote } from '../../util/acoSwapUtil'
import { acoBuyerAddress, btcAddress, menuConfig, zrxExchangeAddress } from '../../util/network'

class SimpleBuyTab extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      selectedType: 1, 
      selectedOption: null,
      deribitPrice: null, 
      qtyValue: "1.0", 
      strikeAssetBalance: null,
      currentPairPrice: null,
      maxSlippage: DEFAULT_SLIPPAGE
    }
  }

  componentDidMount = () => {
    if (this.props.selectedPair) {
      this.onPairChange()
      this.selectType(this.state.selectedType)
      this.refreshAccountBalance()
      this.setPairCurrentPrice()
    }
    this.startQuoteRefresh()
  }

  setPairCurrentPrice = () => {
    if (this.props.selectedPair) {
      var price = this.context.ticker && this.context.ticker[this.props.selectedPair.underlyingSymbol]
      if (price) {
        this.setState({currentPairPrice: price})
      }
    }
  }

  refreshAccountBalance = () => {
    if (this.context.web3.selectedAccount && this.props.selectedPair) {
      getBalanceOfAsset(this.props.selectedPair.strikeAsset, this.context.web3.selectedAccount)
      .then(result => this.setState({strikeAssetBalance: result}))
    }
    else {
      this.setState({strikeAssetBalance: null})
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.componentDidMount()
    } else {
      if (this.props.selectedPair !== prevProps.selectedPair) {
        this.onPairChange()
      }
      if (this.props.selectedPair !== prevProps.selectedPair || !this.state.currentPairPrice) {
        this.setPairCurrentPrice()
      }
      if (this.props.selectedPair !== prevProps.selectedPair ||
        this.props.toggleOptionsLoaded !== prevProps.toggleOptionsLoaded) {
        this.selectType(this.state.selectedType)
      }
      if (this.props.selectedPair !== prevProps.selectedPair ||
        this.props.accountToggle !== prevProps.accountToggle) {
        this.refreshAccountBalance()
      }
    }
  }

  onPairChange = () => {
    var qtyValue = this.getQtyValue()
    this.setState({qtyValue: qtyValue})
  }

  getQtyValue = () => {
    if (this.isBtcAsset()) {
      return "0.1"
    }
    else {
      return "1.0"
    }
  }

  isBtcAsset = () => {
    return this.props.selectedPair && this.props.selectedPair.underlying === btcAddress()
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
        this.internalRefreshSwapQuote(this.state.selectedOption, this.startQuoteRefresh)
      }
    }, 60000)
  }

  onQtyChange = (value) => {
    this.setState({qtyValue: value}, () => this.refresh(this.state.selectedOption))
  }

  selectType = (type) => {
    var [strikeOptions, expirationOptions] = this.filterStrikeAndExpirationOptions(type)
    this.setState({ selectedType: type, strikeOptions: strikeOptions, expirationOptions: expirationOptions}, this.setSelectedOption)
  }

  onStrikeChange = (strikeOption) => {
    this.setState({selectedStrike: strikeOption}, this.setSelectedOption)
  }  

  onExpirationChange = (expirationOption) => {
    var strikeOptions = this.filterStrikeOptions(expirationOption, this.state.selectedType)
    this.setState({selectedExpiration: expirationOption, strikeOptions: strikeOptions}, this.setSelectedOption)
  }

  filterStrikeOptions = (expirationOption, type) => {
    var filteredOptions = this.props.options.filter(o => o.expiryTime.toString() === expirationOption.value && o.isCall === (type === 1))
    var grouppedOptions = groupBy(filteredOptions, "strikePrice")
    var hasCurrentSelectedStrikePrice = false
    var strikeOptions = Object.keys(grouppedOptions).map((strikePrice) => {
      if (this.state.selectedStrike && this.state.selectedStrike.value === strikePrice) {
        hasCurrentSelectedStrikePrice = true
      }
      return { value: strikePrice, name: getOptionFormattedPrice(grouppedOptions[strikePrice][0])}
    })
    if (!hasCurrentSelectedStrikePrice) {
      this.setState({selectedStrike: null})
    }
    return sortBy(strikeOptions, "value")
  }

  filterStrikeAndExpirationOptions = (type) => {
    var strikeOptions = this.state.strikeOptions
    var filteredOptions = this.props.options ? this.props.options.filter(o => o.isCall === (type === 1)) : []
    var grouppedOptions = groupBy(filteredOptions, "expiryTime")
    var hasCurrentSelectedExpiration = false
    var expirationOptions = Object.keys(grouppedOptions).map((expiryTime) => {
      if (this.state.selectedExpiration && this.state.selectedExpiration.value === expiryTime) {
        hasCurrentSelectedExpiration = true
      }
      return { value: expiryTime, name: formatDate(expiryTime, true)}
    })
    if (!hasCurrentSelectedExpiration) {
      this.setState({selectedExpiration: null, selectedStrike: null}, this.setSelectedOption)
    }
    else if (this.state.selectedExpiration) {
      strikeOptions = this.filterStrikeOptions(this.state.selectedExpiration, type)
    }
    return [sortBy(strikeOptions, "value"), sortBy(expirationOptions, "value")]
  }

  setSelectedOption = () => {
    var selectedOption = this.getSelectedOption()
    this.refresh(selectedOption)
    this.setState({selectedOption: selectedOption})
  }

  setDeribitPrice = (selectedOption) => {
    if (selectedOption) {
      getDeribiData(selectedOption).then((r) => {
        if (r) {
          this.setState({deribitPrice: r.best_ask_price * r.underlying_price})
        } else {
          this.setState({deribitPrice: null})
        }
      }).catch((e) => {
        this.setState({deribitPrice: null})
        console.error(e)
      })
    } else {
      this.setState({deribitPrice: null})
    }
  }

  getSelectedOption = () => {
    if (this.state.selectedType && this.state.selectedStrike && this.state.selectedExpiration) {
      var filteredOptions = this.props.options.filter(o => 
        o.isCall === (this.state.selectedType === 1) && 
        o.strikePrice === this.state.selectedStrike.value &&
        o.expiryTime.toString() === this.state.selectedExpiration.value)
      if (filteredOptions && filteredOptions.length === 1) {
        return filteredOptions[0]
      }
    }
    return null    
  }

  onBuyClick = () => {
    if (this.canBuy()) {
      getNextNonce(this.context.web3.selectedAccount).then(nonce => {
        var stepNumber = 0
        this.needApprove().then(needApproval => {
          if (needApproval) {
            this.setStepsModalInfo(++stepNumber, needApproval)
            allowDeposit(this.context.web3.selectedAccount, maxAllowance, this.state.selectedOption.strikeAsset, this.getAllowanceAddress(), nonce)
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
        this.refreshSwapQuote(this.state.selectedOption, () => {
          if (previousQuote && this.state.swapQuote && previousQuote.price.toString(10) === this.state.swapQuote.price.toString(10)) {
            this.setState({verifyModalInfo: null})
            this.sendBuyTransaction(stepNumber, nonce, needApproval)
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
      this.refreshSwapQuote(this.state.selectedOption)
      onCancel()
    }    
    verifyModalInfo.swapQuote = this.state.swapQuote
    verifyModalInfo.timedOut = false
    verifyModalInfo.option = this.props.option
    verifyModalInfo.description = this.getSummaryDescription()
    this.setState({verifyModalInfo: verifyModalInfo})
  }

  getSummaryDescription = () => {
    return <>Pay {this.getTotalToBePaidFormatted()} in return for the right to {this.state.selectedOption.isCall ? "buy" : "sell"} {this.state.qtyValue} {this.state.selectedOption.underlyingInfo.symbol} for {getOptionFormattedPrice(this.state.selectedOption)} each until {formatDate(this.state.selectedOption.expiryTime)}.</>
  }

  sendQuotedTransaction = (nonce) => {
    return buy(this.context.web3.selectedAccount, nonce, this.state.swapQuote.zrxData, this.state.swapQuote.poolData, this.state.selectedOption, this.props.slippage)
  }

  getMaxToPay = () => {
    if (this.state.qtyValue && this.state.qtyValue > 0 && this.state.selectedOption && this.state.swapQuote) {
      var amount = new BigNumber(toDecimals(this.state.qtyValue, this.state.selectedOption.underlyingInfo.decimals))
      var value = amount.times(this.state.swapQuote.price).times((new BigNumber(1)).plus(new BigNumber(this.props.slippage))).div(new BigNumber(toDecimals("1", this.state.selectedOption.underlyingInfo.decimals)))
      return value.integerValue(BigNumber.ROUND_CEIL).toString(10)
    }
  }

  sendBuyTransaction = (stepNumber, nonce, needApproval) => {
    this.setStepsModalInfo(++stepNumber, needApproval)
    this.sendQuotedTransaction(nonce)
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
    var title = (stepNumber <= 2)  ? "Unlock token" : (stepNumber < 3 ? "Verify" : "Buy")
    var subtitle = ""
    var subtitle2 = ""
    var img = null
    var option = this.state.selectedOption
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
      subtitle =  "Verifying..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 4) {
      subtitle = "Confirm on " + this.context.web3.name + " to buy " + this.state.qtyValue + " " + option.acoTokenInfo.symbol  + "."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 5) {
      subtitle = "Buying " + this.state.qtyValue + " " + option.acoTokenInfo.symbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 6) {
      subtitle = "You have successfully purchased the options."
      subtitle2 = "Reminder: Exercise is not automatic, please remember manually exercising in-the-money options before expiration."
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
    steps.push({title: "Verify", progress: stepNumber > 3 ? 100 : 0, active: stepNumber >= 3 ? true : false})
    steps.push({ title: "Buy", progress: stepNumber > 5 ? 100 : 0, active: stepNumber >= 4 ? true : false })
    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        subtitle2: subtitle2,
        steps: steps,
        img: img,
        isDone: (stepNumber === 6 || stepNumber === -1),
        success: (stepNumber === 6),
        onDoneButtonClick: this.onHideStepsModal
      }
    })
  }

  onHideStepsModal = () => {
    let redirect = (this.props.selectedPair && this.state.stepsModalInfo && this.state.stepsModalInfo.success)
    if (redirect) {
      this.setState({ stepsModalInfo: null, selectedStrike: null, qtyValue: this.getQtyValue(), selectedExpiration: null }, () => {
        this.setSelectedOption()
        this.props.refreshExercise()
        var self = this
        setTimeout(() => {
          self.props.history.push('/manage/'+self.props.selectedPair.id)
        },300)
      })
    }
    else {
      this.setState({ stepsModalInfo: null })
    }
  }

  needApprove = () => {
    return new Promise((resolve) => {
      if (!this.isPayEth()) {
        allowance(this.context.web3.selectedAccount, this.state.selectedOption.strikeAsset, this.getAllowanceAddress()).then(result => {
          var resultValue = new Web3Utils.BN(result)
          resolve(resultValue.lt(toDecimals(this.getTotalToBePaid(), this.state.selectedOption.strikeAssetInfo.decimals)))
        })
      }
      else {
        resolve(false)
      }
    })
  }

  getAllowanceAddress = () => {
    if (this.state.swapQuote.poolData.length === 0) {
      return zrxExchangeAddress()
    }
    if (this.state.swapQuote.poolData.length === 1 && this.state.swapQuote.zrxData.length === 0) {
      return this.state.swapQuote.poolData[0].acoPool
    }
    return acoBuyerAddress()
  }
  
  isPayEth = () => {
    return isBaseAsset(this.state.selectedOption.strikeAsset)
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  getButtonMessage = () => {
    if (!this.state.qtyValue || this.state.qtyValue <= 0) {
      return "Enter an amount"
    }
    if (!this.state.selectedStrike) {
      return "Select strike"
    }
    if (!this.state.selectedExpiration) {
      return "Select expiration"
    }
    if (this.isInsufficientFunds()) {
      return "Insufficient funds"
    }
    if (this.state.errorMessage) {
      return this.state.errorMessage
    }
    return null
  }

  canBuy = () => {
    return (!this.state.loadingSwap && this.getButtonMessage() === null) 
  }
  
  getAcoOptionPrice = () => {    
    if (this.state.swapQuote && this.state.selectedOption) {
      return parseFloat(fromDecimals(this.state.swapQuote.price.toString(10), this.state.selectedOption.strikeAssetInfo.decimals, this.state.selectedOption.strikeAssetInfo.decimals, this.state.selectedOption.strikeAssetInfo.decimals))
    }
    return null
  }

  refresh = (selectedOption) => {
    this.setDeribitPrice(selectedOption)
    this.refreshSwapQuote(selectedOption)
  }

  refreshSwapQuote = (selectedOption, callback) => {
    this.setState({swapQuote: null, errorMessage: null, loadingSwap: true}, () => {
      this.internalRefreshSwapQuote(selectedOption, callback)
    })
  }

  internalRefreshSwapQuote = (selectedOption, callback) => {
    if (selectedOption && this.state.qtyValue && this.state.qtyValue > 0) {
      getQuote(true, selectedOption, this.state.qtyValue)
      .then((result) => {
        this.setState({swapQuote: result, errorMessage: null, loadingSwap: false}, callback)
      }).catch((err) => {
        if (err.message === "Insufficient liquidity") {
          this.setState({swapQuote: null, errorMessage: err.message, loadingSwap: false}, callback)
        } else {
          console.error(err)
        }
      })
    }
    else {
      this.setState({swapQuote: null, errorMessage: null, loadingSwap: false}, callback)
    }
  }

  getTotalToBePaid = () => {
    if (this.state.qtyValue &&  this.state.qtyValue > 0) {
      var optionPrice = this.getAcoOptionPrice()
      if (optionPrice) {
        return this.state.qtyValue * optionPrice
      }
    }
    return null
  }

  getTotalToBePaidFormatted = () => {
    var totalToBePaid = this.getTotalToBePaid()
    if (totalToBePaid && this.props.selectedPair) {
      return formatWithPrecision(totalToBePaid) + " " + this.props.selectedPair.strikeAssetSymbol
    }
    return "-"
  }

  getMaxToPayFormatted = () => {
    var maxToPay = this.getMaxToPay()
    if (maxToPay && this.props.selectedPair) {
      return fromDecimals(maxToPay, this.state.selectedOption.strikeAssetInfo.decimals) + " " + this.props.selectedPair.strikeAssetSymbol
    }
    return "-"
  }

  formatPrice = (price) => {
    if (price) {
      return "$" + formatWithPrecision(price)
    }
    return "-"
  }

  getStrikeAssetDecimals = () => {
    return this.state.selectedOption.strikeAssetInfo.decimals
  }

  isInsufficientFunds = () => {
    var totalToBePaid = this.getTotalToBePaid()
    return this.state.selectedOption != null && totalToBePaid !== null && this.state.strikeAssetBalance !== null && this.state.strikeAssetBalance.lt(toDecimals(this.getTotalToBePaid(), this.getStrikeAssetDecimals()))
  }

  getSlippageFormatted = () => {
    return formatPercentage(this.props.slippage)
  }

  onSlippageClick = () => {
    let slippageModalInfo = {}
    slippageModalInfo.onClose = () => this.setState({slippageModalInfo: null})
    this.setState({slippageModalInfo: slippageModalInfo})
  }

  
  getBreakEven = () => {
    let price = this.getAcoOptionPrice()
    let strike = (this.state.selectedOption ? parseFloat(fromDecimals(this.state.selectedOption.strikePrice, this.state.selectedOption.strikeAssetInfo.decimals)) : null)
    if (price && strike && !isNaN(strike)) {
      if (this.state.selectedType === 1) {
        return strike + price
      } else {
        return strike - price
      }
    }
    return null
  }

  onMinusQtyValue = () => {
    var value = 0
    if (this.state.qtyValue) {
      value = parseFloat(this.state.qtyValue)
    }
    value -= 0.1
    if (value < 0) {
      value = 0
    }
    this.onQtyChange(value.toFixed(1))
  }

  onPlusQtyValue = () => {
    var value = 0
    if (this.state.qtyValue) {
      value = parseFloat(this.state.qtyValue)
    }
    value += 0.1
    this.onQtyChange(value.toFixed(1))
  }

  render() {
    var selectedOption = this.state.selectedOption
    var priceFromDecimals = selectedOption ? parseFloat(fromDecimals(selectedOption.strikePrice, selectedOption.strikeAssetInfo.decimals)) : null
    var optionPrice = this.getAcoOptionPrice()
    return <div className="simple-buy-tab">
      <div className="inputs-wrapper">
        <div className="input-column">
          <div className="input-label">Qty</div>
          <div className="input-field qty-value-input">
            {this.isBtcAsset() && <FontAwesomeIcon className="clickable" icon={faMinus} onClick={this.onMinusQtyValue}/>}
            <DecimalInput tabIndex="-1" placeholder="Option amount" onChange={this.onQtyChange} value={this.state.qtyValue}></DecimalInput>
            {this.isBtcAsset() && <FontAwesomeIcon className="clickable" icon={faPlus} onClick={this.onPlusQtyValue}/>}
          </div>
        </div>
        <div className="input-column">
          <div className="input-label">Type</div>
          <div className="input-field type-toggle">
            <OptionBadge onClick={() => this.selectType(1)} className={this.state.selectedType === 1 ? "active" : "unselected"} isCall={true}/>
            <OptionBadge onClick={() => this.selectType(2)} className={this.state.selectedType === 2 ? "active" : "unselected"} isCall={false}/>
          </div>
        </div>
        <div className="input-column expiration-column">
          <div className="input-label">Expiration</div>
          <div className="input-field">
            <SimpleDropdown placeholder="Select expiration" selectedOption={this.state.selectedExpiration} options={this.state.expirationOptions} onSelectOption={this.onExpirationChange}></SimpleDropdown>
          </div>
        </div>
        <div className="input-column strike-column">
          <div className="input-label">Strike</div>
          <div className="input-field">
            {this.state.selectedExpiration ? 
              <SimpleDropdown placeholder="Select strike" selectedOption={this.state.selectedStrike} options={this.state.strikeOptions} onSelectOption={this.onStrikeChange}></SimpleDropdown>:
              <span className="simple-dropdown-placeholder">Select expiration first</span>
            }
            
          </div>
        </div>
      </div>
      {menuConfig().hasCreateOption && <div className="create-link-wrapper">
        <NavLink className="nav-link" to="/new-option">Want more flexibility? Create your custom option!</NavLink>
      </div>}
      <div className="chart-and-prices">
        <div className="option-chart-wrapper">
          <OptionChart isCall={this.state.selectedType === 1} currentPrice={(!!this.state.currentPairPrice ? parseFloat(this.state.currentPairPrice) : null)} isBuy={true} strikePrice={priceFromDecimals} optionPrice={optionPrice} quantity={(!!this.state.qtyValue ? parseFloat(this.state.qtyValue) : null)}/>
        </div>
        <div className="prices-wrapper">
          <div className="input-column">
            <div className="input-label">Total to be paid</div>
            <div className="input-value">
              {this.getTotalToBePaidFormatted()}
            </div>
          </div>
          <div className="separator"></div>
          <div className="input-column">
            <div className="input-label">Price per option:</div>
            <div className="price-value">{this.formatPrice(optionPrice)}</div>
            <div className="input-label">Break-even:</div>
            <div className="price-value">{this.formatPrice(this.getBreakEven())}</div>
          </div>
          <div className="separator"></div>
          <div className="input-column configurations-column">
            <div className="input-label">Slippage tolerance&nbsp;<FontAwesomeIcon data-tip data-for={"slippage-tolerance-tooltip"} icon={faInfoCircle}></FontAwesomeIcon></div>
            <div className="input-value clickable" onClick={this.onSlippageClick}>
              {this.getSlippageFormatted()}
            </div>
            <ReactTooltip className="info-tooltip" id={"slippage-tolerance-tooltip"}>
              Your transaction will revert if the price changes unfavorably by more than this percentage.
            </ReactTooltip>
            <div className="input-label">Maximum to be paid&nbsp;<FontAwesomeIcon data-tip data-for={"maximum-to-pay-tooltip"} icon={faInfoCircle}></FontAwesomeIcon></div>
            <div className="input-value">
              {this.getMaxToPayFormatted()}
            </div>
            <ReactTooltip className="info-tooltip" id={"maximum-to-pay-tooltip"}>
              Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.
            </ReactTooltip>
          </div>
        </div>
      </div>
      <div className="action-button-wrapper">
        {!this.props.isConnected ? 
          <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
            <div>CONNECT WALLET</div>
          </div> :
          (this.canBuy() ?
            <div className="action-btn medium solid-blue" onClick={this.onBuyClick}>
              <div>BUY</div>
            </div> :
            <div className="action-btn medium solid-blue disabled">
              <div>{this.state.loadingSwap ? "Loading..." : this.getButtonMessage()}</div>
            </div>)
        }
      </div>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
      {this.state.verifyModalInfo && <VerifyModal {...this.state.verifyModalInfo} />}
      {this.state.slippageModalInfo && <SlippageModal {...this.props} {...this.state.slippageModalInfo} />}
    </div>
  }
}

SimpleBuyTab.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(SimpleBuyTab)