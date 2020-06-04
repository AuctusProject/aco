import './TradeOptionsList.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { formatDate, fromDecimals, groupBy, formatWithPrecision, getTimeToExpiry } from '../util/constants'
import OptionBadge from './OptionBadge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner} from '@fortawesome/free-solid-svg-icons'

class TradeOptionsList extends Component {
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
      sortedOrders = orders.filter(order => order.side === side).sort((o1, o2) => (side === 0) ? o1.price.comparedTo(o2.price) : o2.price.comparedTo(o1.price))
      bestOrder = sortedOrders.length > 0 ? sortedOrders[0] : null
      bestOrder.totalSize = bestOrder.size
      for (let index = 1; index < sortedOrders.length; index++) {
        const order = sortedOrders[index];
        if (order.price.eq(bestOrder.price)) {
          bestOrder.totalSize = bestOrder.totalSize.plus(order.size)
        }
      }
    }
    return bestOrder
  }

  onSelectOption = (option) => {
    this.props.onSelectOption(option)
  }

  optionRowInfo = (option) => {
    if (!option) {
      return <>
        <td colSpan="5">N/A</td>
      </>
    }
    if (!this.props.orderBooks[option.acoToken]) {
      return <>
        <td className="clickable" onClick={() => this.onSelectOption(option)} colSpan="4"><FontAwesomeIcon icon={faSpinner} className="fa-spin"/></td>
        <td className="clickable" onClick={() => this.onSelectOption(option)}>{this.props.balances[option.acoToken] ? fromDecimals(this.props.balances[option.acoToken], option.underlyingInfo.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</td>
      </>
    }
    var bestBid = this.getBestBid(option)
    var bestAsk = this.getBestAsk(option)
    return  <>
      <td className="size-col clickable" onClick={() => this.onSelectOption(option)}>{bestBid ? fromDecimals(bestBid.totalSize, option.strikeAssetInfo.decimals) : "-"}</td>
      <td className="bid-col clickable" onClick={() => this.onSelectOption(option)}>{bestBid ? <span className="bid-price">{formatWithPrecision(bestBid.price)}</span> : "-"}</td>
      <td className="ask-col clickable" onClick={() => this.onSelectOption(option)}>{bestAsk ? <span className="ask-price">{formatWithPrecision(bestAsk.price)}</span> : "-"}</td>
      <td className="size-col clickable" onClick={() => this.onSelectOption(option)}>{bestAsk ? fromDecimals(bestAsk.totalSize, option.strikeAssetInfo.decimals) : "-"}</td>
      <td className="balance-col clickable" onClick={() => this.onSelectOption(option)}>{this.props.balances[option.acoToken] ? fromDecimals(this.props.balances[option.acoToken], option.underlyingInfo.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</td>
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
    return (<div className="trade-options-list py-5">
          <div className="page-title">{pairTitle} options</div>
          <table className="aco-table mx-auto">
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
              <>
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
                    <th className="size-col">SIZE</th>
                    <th className="bid-col">BID</th>
                    <th className="ask-col">ASK</th>
                    <th className="size-col">SIZE</th>
                    <th className="balance-col">BALANCE</th>
                    <th className="strike-col">STRIKE</th>
                    <th className="size-col">SIZE</th>
                    <th className="bid-col">BID</th>
                    <th className="ask-col">ASK</th>
                    <th className="size-col">SIZE</th>
                    <th className="balance-col">BALANCE</th>
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
              </>
          ))}
          </table>
        </div>)
  }
}
TradeOptionsList.contextTypes = {
  web3: PropTypes.object
}
export default TradeOptionsList