import './Orderbook.css'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { mergeByPrice } from '../../util/Zrx/zrxUtils'
import { fromDecimals } from '../../util/constants'

class Orderbook extends Component {
  constructor() {
    super()
    this.state = {}
  }
  
  componentDidUpdate = (prevProps) => {
  }

  componentDidMount = () => {
  }

  getBuyOrders = () => {
    return this.context.orderbook && this.context.orderbook.bid && this.context.orderbook.bid.orders
  }

  getSellOrders = () => {
    return this.context.orderbook && this.context.orderbook.ask && this.context.orderbook.ask.orders && this.context.orderbook.ask.orders.reverse()
  }

  formatSize = (size) => {
    return fromDecimals(size, this.props.option.acoTokenInfo.decimals)
  }

  formatPrice = (price) => {
    return fromDecimals(price, this.props.option.strikeAssetInfo.decimals)
  }

  getSpreadValue = () => {
    var buyOrders = this.getBuyOrders()
    var sellOrders = this.getSellOrders()
    if (buyOrders && buyOrders.length > 0 && sellOrders && sellOrders.length > 0) {
      var spread = sellOrders[0].price.minus(buyOrders[0].price)
      return this.formatPrice(spread)
    }
    return "-"
  }
  
  render() {
    var buyOrders = this.getBuyOrders()
    var sellOrders = this.getSellOrders()
    return (
      <div className="orderbook-box">
        <div className="box-title-wrapper">
          <h1 className="box-title">Orderbook</h1>
        </div>
        <div className="orderbook-table">
          <div className="orderbook-table-headers">
            <div className="orderbook-table-header-item orderbook-size-col">Size</div>
            <div className="orderbook-table-header-item orderbook-price-col">Price (USDC)</div>
          </div>
          <div className="orderbook-table-body">
            <div className="orderbook-table-body-content">
              <div className="orderbook-table-sell">
                {sellOrders && sellOrders.map(sellOrder => <div key={sellOrder.acoPool ? sellOrder.acoPool : sellOrder.orderHash} className="orderbook-table-sell-row">
                  <div className="orderbook-table-sell-item orderbook-size-col">{this.formatSize(sellOrder.acoAmount)}</div>
                  <div className="orderbook-table-sell-item orderbook-price-col">{this.formatPrice(sellOrder.price)}</div>
                  
                </div>)}
              </div>
              <div className="orderbook-table-spread-row">
                <div className="orderbook-table-spread-item">Spread</div>
                <div className="orderbook-table-spread-value">{this.getSpreadValue()}</div>                
              </div>
              <div className="orderbook-table-buy">
                {buyOrders && buyOrders.map(buyOrder => <div key={buyOrder.orderHash} className="orderbook-table-buy-row">
                  <div className="orderbook-table-buy-item orderbook-size-col">{this.formatSize(buyOrder.acoAmount)}</div>
                  <div className="orderbook-table-buy-item orderbook-price-col">{this.formatPrice(buyOrder.price)}</div>                  
                </div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Orderbook.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object,
  orderbook: PropTypes.object,
}
export default withRouter(Orderbook)