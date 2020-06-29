import './SimpleWriteTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import StepIndicator from '../Write/StepIndicator'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { groupBy, formatDate, ONE_YEAR_TOTAL_MINUTES, fromDecimals, getBinanceSymbolForPair, getSecondsToExpiry, formatPercentage, formatWithPrecision, swapQuoteBuySize } from '../../util/constants'
import { getOptionFormattedPrice } from '../../util/acoTokenMethods'
import { getSwapQuote } from '../../util/zrxApi'
import Loading from '../Util/Loading'
import SimpleWriteStep2 from './SimpleWriteStep2'
import { ASSETS_INFO } from '../../util/assets'
import ReactTooltip from 'react-tooltip'

class SimpleWriteTab extends Component {
  constructor(props) {
    super(props)
    this.state = {currentStep: 1, swapQuotes: null, currentPairPrice: null}
  }

  componentDidMount = () => {
    this.loadOptionsSwapQuotes()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair ||
      this.props.toggleOptionsLoaded !== prevProps.toggleOptionsLoaded) {
        this.loadOptionsSwapQuotes()
    }
    else if (this.state.currentPairPrice == null && !!this.getPairCurrentPrice()){
      this.setState({currentPairPrice: this.getPairCurrentPrice()}, this.setOptionsReturnIfFlatAndAnnualizedReturn)
    }
  }

  loadOptionsSwapQuotes = () => {
    this.setState({swapQuotes: null}, () => {
      var swapQuotesPromises = []
      var swapQuotes = {}
      for (let index = 0; index < this.props.options.length; index++) {
        const option = this.props.options[index];
        var swapQuotePromise = getSwapQuote(option.strikeAsset, option.acoToken, swapQuoteBuySize, true)
        swapQuotesPromises.push(swapQuotePromise)
        swapQuotePromise.then(swapQuote => {
          swapQuote.price = 1/swapQuote.price
          this.setSwapQuoteReturns(option, swapQuote)
          swapQuotes[option.acoToken] = swapQuote
        }).catch((err) => {
          swapQuotes[option.acoToken] = false
        })
      }
      Promise.allSettled(swapQuotesPromises).then(() => {
        this.setState({swapQuotes: swapQuotes})
      })
    })
  }

  setOptionsReturnIfFlatAndAnnualizedReturn = () => {
    var swapQuotes = this.state.swapQuotes
    if (swapQuotes) {
      for (let index = 0; index < this.props.options.length; index++) {
        const option = this.props.options[index];
        var swapQuote = swapQuotes[option.acoToken]
        this.setSwapQuoteReturns(option, swapQuote)
      }    
      this.setState({swapQuotes: swapQuotes})
    }
  }

  setSwapQuoteReturns = (option, swapQuote) => {
    if (swapQuote) {
      swapQuote.returnIfFlat = this.getReturnIfFlat(option, swapQuote.price)
      swapQuote.annualizedReturn = this.getAnnualizedReturn(option, swapQuote.returnIfFlat)
    }
  }

  setCurrentStep = (step) => {
    this.setState({currentStep: step})
  }

  onSelectOption = (option) => () => {
    this.setState({selectedOption: option, currentStep: 2})
  }

  getOptionPremium = (option) => {
    if (option && this.state.swapQuotes[option.acoToken]) {
      return formatWithPrecision(this.state.swapQuotes[option.acoToken].price) + " " + this.props.selectedPair.strikeAssetSymbol
    }
    return "-"
  }

  getFormattedReturnIfFlat = (option) => {
    if (option && this.state.swapQuotes[option.acoToken] && this.state.swapQuotes[option.acoToken].returnIfFlat) {
      return formatPercentage(this.state.swapQuotes[option.acoToken].returnIfFlat)
    }
    return "-"
  }

  getFormattedAnnualizedReturn = (option) => {
    if (option && this.state.swapQuotes[option.acoToken] && this.state.swapQuotes[option.acoToken].annualizedReturn) {
      return formatPercentage(this.state.swapQuotes[option.acoToken].annualizedReturn)
    }
    return "-"
  }

  getReturnIfFlat = (option, bid) => {
    var price = this.getPairCurrentPrice()
    var strikePrice = this.getStrikePrice(option)
    if (bid && price && strikePrice) {
      if (option.isCall && bid > (price - strikePrice)) {
        if (strikePrice > price) {
          return bid / (price - bid)
        }
        else {
          return (bid - (strikePrice - price)) / (price - bid)
        }      
      }
      else if (!option.isCall && bid > (strikePrice - price)) {
        if (strikePrice > price) {
          return (bid - (strikePrice - price)) / strikePrice
        }
        else {
          return bid / strikePrice
        }      
      } 
    }
    return null  
  }

  getStrikePrice = (option) => {
    return parseFloat(fromDecimals(option.strikePrice, option.strikeAssetInfo.decimals))
  }

  getPairCurrentPrice = () => {
    if (this.props.selectedPair) {
      var pairSymbol = getBinanceSymbolForPair(this.props.selectedPair)
      return this.context.ticker && this.context.ticker.data[pairSymbol] && this.context.ticker.data[pairSymbol].currentClosePrice
    }
    return null
  }

  getAnnualizedReturn = (option, flatReturn) => {
    var secondsToExpiry = getSecondsToExpiry(option.expiryTime)
    if (flatReturn) {
      return flatReturn * ONE_YEAR_TOTAL_MINUTES / (secondsToExpiry / 60)
    }
    return null
  }

  getAssetIcon = (isCall) => {
    var pair = this.props.selectedPair
    var iconUrl = null
    if (isCall === "true") {
      iconUrl = ASSETS_INFO[pair.underlyingSymbol] ? ASSETS_INFO[pair.underlyingSymbol].icon : null
    }
    else {
      iconUrl = ASSETS_INFO[pair.strikeAssetSymbol] ? ASSETS_INFO[pair.strikeAssetSymbol].icon : null
    }
    if (iconUrl) {
      return <img className="asset-icon" src={iconUrl} alt=""></img>
    }
    return null
  }
  
  getTypeTooltip = (isCall) => {    
    var pair = this.props.selectedPair
    return <ReactTooltip className="option-type-tooltip" id={isCall + ".option-tooltip"}>
      {isCall === "true" ? <div>Receive money today for your willingness to sell {pair.underlyingSymbol} at the strike price. This potential income-generating options strategy is referred to as the covered call.</div>
      : <div>Receive money today for your willingness to buy {pair.underlyingSymbol} at the strike price. It may seem a little counter-intuitive, but you can write puts to buy {pair.underlyingSymbol}. This options strategy is referred to as the cash-secured put.</div>}
    </ReactTooltip>
  }

  render() {
    var filteredOptions = (this.props.options && this.state.swapQuotes) ? this.props.options.filter(o => !!this.state.swapQuotes[o.acoToken] && !!this.state.swapQuotes[o.acoToken].returnIfFlat && this.state.swapQuotes[o.acoToken].returnIfFlat > 0) : []
    var grouppedOptions = groupBy(filteredOptions, "isCall")
    
    return <div className="simple-write-tab">
      {(this.state.currentPairPrice && this.state.swapQuotes) ? <>
        {this.state.currentStep !== 3 && <StepIndicator totalSteps={2} current={this.state.currentStep} setCurrentStep={this.setCurrentStep}></StepIndicator>}
        {this.props.selectedPair && filteredOptions.length === 0 && <div className="text-center">No options available for {this.props.selectedPair.underlyingSymbol}{this.props.selectedPair.strikeAssetSymbol}</div>}
        {this.state.currentStep === 1 && Object.keys(grouppedOptions).map(isCall => (
          <div key={isCall} className="write-option-group">
            <div className="earn-title">{this.getAssetIcon(isCall)} Earn income on {isCall === "true" ? this.props.selectedPair.underlyingSymbol : this.props.selectedPair.strikeAssetSymbol} <FontAwesomeIcon data-tip data-for={isCall + ".option-tooltip"} icon={faInfoCircle}></FontAwesomeIcon></div>
            {this.getTypeTooltip(isCall)}
            <table className="aco-table mx-auto table-responsive-sm">
              <thead>
                <tr>
                  <th>Strike Price</th>
                  <th>Expiration</th>
                  <th>Earn Premium</th>
                  <th>Return if Flat</th>
                  <th>Annualized Return</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(!grouppedOptions[isCall] || grouppedOptions[isCall].length === 0) && 
                  <tr>
                    {grouppedOptions[isCall].length === 0 && <td colSpan="6">No positions for {this.props.selectedPair.underlyingSymbol}{this.props.selectedPair.strikeAssetSymbol}</td>}
                  </tr>
                }
                {grouppedOptions[isCall].map(option => 
                <tr className="clickable" key={option.acoToken} onClick={this.onSelectOption(option)}>
                  <td>{getOptionFormattedPrice(option)}</td>
                  <td>{formatDate(option.expiryTime, true)}</td>
                  <td>{this.getOptionPremium(option)}</td>
                  <td>{this.getFormattedReturnIfFlat(option)}</td>
                  <td>{this.getFormattedAnnualizedReturn(option)}</td>
                  <td>
                    <FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
                  </td>
                </tr>)}
              </tbody>
            </table> 
          </div>
        ))}
        {this.state.currentStep === 2 && this.state.selectedOption &&
          <SimpleWriteStep2 {...this.props} option={this.state.selectedOption} currentPairPrice={this.state.currentPairPrice} setSwapQuoteReturns={this.setSwapQuoteReturns} />
        }
        </>
        :
        <Loading/>}
    </div>
  }
}

SimpleWriteTab.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(SimpleWriteTab)