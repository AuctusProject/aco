import './AdvancedTrade.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import BuySell from './BuySell'
import Orderbook from './Orderbook'
import OpenOrders from './OpenOrders'
import WebsocketOrderProvider from '../../util/Zrx/WebsocketOrderProvider'
import { getTimeToExpiry } from '../../util/constants'

class AdvancedTrade extends Component {
  constructor() {
    super()
    this.state = {}
  }
  
  componentDidUpdate = (prevProps) => {
  }

  componentDidMount = () => {
  }

  getTimeToExpiryLabel = () => {
    var expiryTime = this.props.option.expiryTime
    var timeToExpiry = getTimeToExpiry(expiryTime)
    return timeToExpiry.days > 0 ? 
        `${timeToExpiry.days}d ${timeToExpiry.hours}h` :
        `${timeToExpiry.hours}h ${timeToExpiry.minutes}m`;
  }

  setPlaceOrderData = (isBuy, price, amount) => {
    this.buySell.setOrderData(isBuy, price, amount)
  }
  
  render() {
    return (
      <div className="advanced-trade">
        <div className="advanced-trade-row">
          <div className="advanced-trade-header">
            <span className="advanced-trade-selected-option">
              {this.props.option.acoTokenInfo.symbol}
            </span>
            <div className="time-to-expiry-details">
              <div className="time-to-expiry-label">Time to expiry</div>
              <div className="time-to-expiry-label">{this.getTimeToExpiryLabel()}</div>
            </div>
          </div>
        </div>
        <div className="advanced-trade-row">
          <WebsocketOrderProvider option={this.props.option}>
            <div className="advanced-trade-col">
              <BuySell ref={ref => this.buySell = ref} {...this.props}></BuySell>
            </div>
            <div className="advanced-trade-col">
              <Orderbook {...this.props} setPlaceOrderData={this.setPlaceOrderData}></Orderbook>
            </div>
            <div className="advanced-trade-col">
              <OpenOrders {...this.props}></OpenOrders>
            </div>
          </WebsocketOrderProvider>
        </div>
      </div>
    );
  }
}

AdvancedTrade.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object,
}
export default withRouter(AdvancedTrade)