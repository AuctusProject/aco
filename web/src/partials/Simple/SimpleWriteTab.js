import './SimpleWriteTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import StepIndicator from '../Write/StepIndicator'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { groupBy, formatDate, ONE_YEAR_TOTAL_MINUTES, fromDecimals, getSecondsToExpiry, formatPercentage, formatWithPrecision, toDecimals, swapQuoteSellSize } from '../../util/constants'
import { getOptionFormattedPrice } from '../../util/acoTokenMethods'
import Loading from '../Util/Loading'
import SimpleWriteStep2 from './SimpleWriteStep2'
import { ASSETS_INFO } from '../../util/assets'
import ReactTooltip from 'react-tooltip'
import BigNumber from 'bignumber.js'
import { getQuote } from '../../util/acoSwapUtil'

class SimpleWriteTab extends Component {
  constructor(props) {
    super(props)
    this.state = {currentStep: 1, swapQuotes: null, currentPairPrice: null, filteredOptions: [], loadingOptions: true}
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
    this.setState({swapQuotes: null, loadingOptions: true, currentStep: 1,}, () => {
      let swapQuotesPromises = []
      let swapQuotes = this.props.options.length > 0 ? {} : null
      for (let index = 0; index < this.props.options.length; index++) {        
        let option = this.props.options[index];
        swapQuotesPromises.push(new Promise((resolve) => {
            getQuote(false, option, swapQuoteSellSize).then(swapQuote => {   
              swapQuotes[option.acoToken] = swapQuote
              resolve()
          }).catch((err) => {
            swapQuotes[option.acoToken] = false
            resolve()
          })
        }))
      }
      Promise.allSettled(swapQuotesPromises).then(() => {
        let loadingPrice = this.state.currentPairPrice == null
        this.setState({swapQuotes: swapQuotes}, () => {
          if (!loadingPrice) {
            this.setOptionsReturnIfFlatAndAnnualizedReturn()
          }
        })
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
      this.setState({swapQuotes: swapQuotes, loadingOptions: this.state.currentPairPrice == null}, () => this.setFilteredOptions())
    }
  }

  setSwapQuoteReturns = (option, swapQuote) => {
    if (swapQuote && swapQuote.price) {
      swapQuote.returnIfFlat = this.getReturnIfFlat(option, swapQuote.price)
      swapQuote.annualizedReturn = this.getAnnualizedReturn(option, swapQuote.returnIfFlat)
    }
  }

  setFilteredOptions = () => {
    var filteredOptions = (!this.state.loadingOptions && this.props.options && this.state.swapQuotes) ? this.props.options.filter(o => !!this.state.swapQuotes[o.acoToken] && !!this.state.swapQuotes[o.acoToken].returnIfFlat && this.state.swapQuotes[o.acoToken].returnIfFlat > 0) : []
    this.setState({filteredOptions: filteredOptions})
  }

  setCurrentStep = (step) => {
    this.setState({currentStep: step})
  }

  onSelectOption = (option) => () => {
    this.setState({selectedOption: option, currentStep: 2})
  }

  getOptionPremium = (option) => {
    if (option && this.state.swapQuotes[option.acoToken] && this.state.swapQuotes[option.acoToken].price) {
      return formatWithPrecision(parseFloat(fromDecimals(this.state.swapQuotes[option.acoToken].price.toString(10), option.strikeAssetInfo.decimals, option.strikeAssetInfo.decimals, option.strikeAssetInfo.decimals))) + " " + this.props.selectedPair.strikeAssetSymbol
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
    var price = new BigNumber(toDecimals(this.getPairCurrentPrice(), option.strikeAssetInfo.decimals))
    var strikePrice = new BigNumber(option.strikePrice)
    var value = null
    var oneStrike = new BigNumber(toDecimals("1", option.strikeAssetInfo.decimals))
    if (bid && price && strikePrice) {
      if (option.isCall && bid.gt(price.minus(strikePrice))) {
        if (strikePrice.gt(price)) {
          value = bid.times(oneStrike).div(price.minus(bid))
        }
        else {
          value = bid.minus(price.minus(strikePrice)).times(oneStrike).div(price.minus(bid))
        }      
      }
      else if (!option.isCall && bid.gt(strikePrice.minus(price))) {
        if (strikePrice.gt(price)) {
          value = bid.minus(strikePrice.minus(price)).times(oneStrike).div(strikePrice)
        }
        else {
          value = bid.times(oneStrike).div(strikePrice)
        }      
      } 
    }
    return value ? parseFloat(fromDecimals(value.integerValue(BigNumber.ROUND_CEIL).toString(10), option.strikeAssetInfo.decimals, option.strikeAssetInfo.decimals, option.strikeAssetInfo.decimals)) : null 
  }

  getPairCurrentPrice = () => {
    if (this.props.selectedPair) {
      var price = this.context.ticker && this.context.ticker[this.props.selectedPair.underlyingSymbol]
      return price
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
      iconUrl = this.context && this.context.assetsImages && this.context.assetsImages[pair.underlyingSymbol]
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
    var filteredOptions = this.state.filteredOptions
    var grouppedOptions = groupBy(filteredOptions, "isCall")

    return <div className="simple-write-tab">
      {(!this.state.loadingOptions && this.state.currentPairPrice && this.state.swapQuotes) ? <>
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
                    {grouppedOptions[isCall].length === 0 && <td colSpan="6">No options for {this.props.selectedPair.underlyingSymbol}{this.props.selectedPair.strikeAssetSymbol}</td>}
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
  assetsImages: PropTypes.object,
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(SimpleWriteTab)