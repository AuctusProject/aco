import './TradeOptionsList.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { formatDate, fromDecimals, groupBy, formatWithPrecision, getTimeToExpiry } from '../util/constants'
import OptionBadge from './OptionBadge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner} from '@fortawesome/free-solid-svg-icons'
import { ALL_OPTIONS_KEY } from '../pages/Trade'

export const TradeOptionsListLayoutMode = {
  Trade: 0,
  Home: 1
}

class TradeOptionsList extends Component {
  
  componentDidMount = () => {
    this.wrapperDiv.scrollBy((this.tableEl.getBoundingClientRect().width - this.wrapperDiv.getBoundingClientRect().width) / 2, 0)
  }

  getOptionsGrouppedByDateAndPrice = () => {
    var grouppedOptions = this.props.options ? groupBy(this.props.options, "expiryTime") : {}
    var expirations = Object.keys(grouppedOptions)
    for (let index = 0; index < expirations.length; index++) {
      let optionsFromExpiration = grouppedOptions[expirations[index]]
      grouppedOptions[expirations[index]] = groupBy(optionsFromExpiration, "strikePrice")
    }
    return grouppedOptions
  }

  getBestBid = (option) => {
    return this.getBestOrder(option, 1)
  }

  getBestAsk = (option) => {
    return this.getBestOrder(option, 0)    
  }

  getBestOrder = (option, side) => {
    var orders = this.props.orderBooks[option.acoToken]
    var sortedOrders = []
    var bestOrder = null
    if (orders && orders.length > 0) {
      sortedOrders = orders.filter(order => order.side === side && order.status === 3).sort((o1, o2) => (side === 0) ? o1.price.comparedTo(o2.price) : o2.price.comparedTo(o1.price))
      bestOrder = sortedOrders.length > 0 ? sortedOrders[0] : null
      if (bestOrder) {
        bestOrder.totalSize = bestOrder.size
        if (bestOrder.filled) {
          bestOrder.totalSize = bestOrder.totalSize.minus(bestOrder.filled)
        }
        for (let index = 1; index < sortedOrders.length; index++) {
          const order = sortedOrders[index];
          if (order.price.eq(bestOrder.price)) {
            bestOrder.totalSize = bestOrder.totalSize.plus(order.size)
            if (order.filled) {
              bestOrder.totalSize = bestOrder.totalSize.minus(order.filled)
            }
          }
        }
      }
    }
    return bestOrder
  }

  onSelectOption = (option) => {
    this.props.onSelectOption(option)
  }

  onMintClick = (option) => {
    this.props.onSelectMintOption(option)
  }

  optionRowInfo = (option) => {
    if (!option) {
      return <>
        <td colSpan="5">N/A</td>
      </>
    }
    var actionBtnTd = <td className="action-col">
      <div className="action-btn" onClick={() => this.onSelectOption(option)}>TRADE</div>
      <div className="action-btn outline-btn" onClick={() => this.onMintClick(option)}>MINT</div>
    </td>

    if (!this.props.orderBooks[option.acoToken]) {
      return <>
        {this.props.mode === TradeOptionsListLayoutMode.Home && option.isCall && actionBtnTd}
        <td className="clickable" onClick={() => this.onSelectOption(option)} colSpan="4"><FontAwesomeIcon icon={faSpinner} className="fa-spin"/></td>
        {this.props.mode === TradeOptionsListLayoutMode.Trade && <td className="balance-col clickable" onClick={() => this.onSelectOption(option)}>{this.props.balances[option.acoToken] ? fromDecimals(this.props.balances[option.acoToken], option.underlyingInfo.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</td>}
        {this.props.mode === TradeOptionsListLayoutMode.Home && !option.isCall && actionBtnTd}
      </>
    }
    var bestBid = this.getBestBid(option)
    var bestAsk = this.getBestAsk(option)
    
    return  <>
      {this.props.mode === TradeOptionsListLayoutMode.Home && option.isCall && actionBtnTd}
      <td className="size-col clickable" onClick={() => this.onSelectOption(option)}>{bestBid ? fromDecimals(bestBid.totalSize, option.underlyingInfo.decimals) : "-"}</td>
      <td className="bid-col clickable" onClick={() => this.onSelectOption(option)}>{bestBid ? <span className="bid-price">{formatWithPrecision(bestBid.price)}</span> : "-"}</td>
      <td className="ask-col clickable" onClick={() => this.onSelectOption(option)}>{bestAsk ? <span className="ask-price">{formatWithPrecision(bestAsk.price)}</span> : "-"}</td>
      <td className="size-col clickable" onClick={() => this.onSelectOption(option)}>{bestAsk ? fromDecimals(bestAsk.totalSize, option.underlyingInfo.decimals) : "-"}</td>
      {this.props.mode === TradeOptionsListLayoutMode.Trade && <td className="balance-col clickable" onClick={() => this.onSelectOption(option)}>{this.props.balances[option.acoToken] ? fromDecimals(this.props.balances[option.acoToken], option.underlyingInfo.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</td>}
      {this.props.mode === TradeOptionsListLayoutMode.Home && !option.isCall && actionBtnTd}
    </>
  }

  getOptionFromType = (optionsList, isCall) => {
    for (let index = 0; index < optionsList.length; index++) {
      const element = optionsList[index];
      if (element.isCall === isCall) {
        return element
      }
    }
    return null
  }

  getTimeToExpiryLabel = (expiryTime) => {
    var timeToExpiry = getTimeToExpiry(expiryTime)
    return timeToExpiry.days > 0 ? 
        `${timeToExpiry.days}d ${timeToExpiry.hours}h` :
        `${timeToExpiry.hours}h ${timeToExpiry.minutes}m`;
  }

  render() {
    var pair = this.props.selectedPair    
    var grouppedOptions = this.getOptionsGrouppedByDateAndPrice()
    var pairTitle = pair.underlyingSymbol + pair.strikeAssetSymbol
    return (<div ref={ref => this.wrapperDiv = ref} className="trade-options-list py-5">
          <table ref={ref => this.tableEl = ref} className="aco-table mx-auto">
            {this.props.options && this.props.options.length === 0 && 
              <thead>
                <tr>
                  <td className="option-expiry-title-cell" colSpan="11">
                    No options for {pairTitle}
                  </td>
                </tr>
              </thead>
            }
            {grouppedOptions && Object.keys(grouppedOptions).map(expiryTime => (
              (this.props.selectedExpiryTime === ALL_OPTIONS_KEY || this.props.selectedExpiryTime === expiryTime) &&
              <React.Fragment key={expiryTime}>
                <thead>
                  <tr>
                    <td className="option-expiry-title-cell" colSpan="11">
                      <div className="option-expiry-title">
                        <div><OptionBadge isCall={true}/></div>
                        <div className="expiration-time">
                          <span>{formatDate(expiryTime)}</span>
                          <span className="expiration-from-now">Expires in {this.getTimeToExpiryLabel(expiryTime)}</span>
                        </div>
                        <div><OptionBadge isCall={false}/></div>
                      </div>
                    </td>
                  </tr>
                </thead>
                <thead>
                  <tr>
                    {this.props.mode === TradeOptionsListLayoutMode.Home && <th className="action-col"></th>}
                    <th className="size-col">SIZE</th>
                    <th className="bid-col">BID</th>
                    <th className="ask-col">ASK</th>
                    <th className="size-col">SIZE</th>
                    {this.props.mode === TradeOptionsListLayoutMode.Trade && <th className="balance-col">BALANCE</th>}
                    <th className="strike-col">STRIKE</th>
                    <th className="size-col">SIZE</th>
                    <th className="bid-col">BID</th>
                    <th className="ask-col">ASK</th>
                    <th className="size-col">SIZE</th>
                    {this.props.mode === TradeOptionsListLayoutMode.Home && <th className="action-col"></th>}
                    {this.props.mode === TradeOptionsListLayoutMode.Trade && <th className="balance-col">BALANCE</th>}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(grouppedOptions[expiryTime]).map(strike => 
                  <tr key={strike}>
                    {this.optionRowInfo(this.getOptionFromType(grouppedOptions[expiryTime][strike], true))}
                    <td className="strike-col">{fromDecimals(strike, grouppedOptions[expiryTime][strike][0].strikeAssetInfo.decimals)}</td>
                    {this.optionRowInfo(this.getOptionFromType(grouppedOptions[expiryTime][strike], false))}
                  </tr>)}
                </tbody>
              </React.Fragment>
          ))}
          </table>
        </div>)
  }
}
TradeOptionsList.contextTypes = {
  web3: PropTypes.object
}
export default TradeOptionsList