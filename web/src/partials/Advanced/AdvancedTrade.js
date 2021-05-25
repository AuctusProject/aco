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
  
  render() {
    var market = {
      makerToken: "0x57ab1ec28d129707052df4df418d58a2d46d5f51",
      takerToken: "0x56bc8fa2b2b48d7a9427f21565265c29a31a8bd4"
    }
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
              <BuySell {...this.props}></BuySell>
            </div>
            <div className="advanced-trade-col">
              <Orderbook {...this.props}></Orderbook>
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