import './Orderbook.css'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { mergeByPrice } from '../../util/Zrx/zrxUtils'

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
    return this.context.orders.filter(o => o.order.takerToken === this.props.makerToken)
  }

  getSellOrders = () => {
    return this.context.orders.filter(o => o.order.makerToken === this.props.makerToken)
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
            <div className="orderbook-table-header-item orderbook-my-size-col">My Size</div>
          </div>
          <div className="orderbook-table-body">
            <div className="orderbook-table-body-content">
              <div className="orderbook-table-sell">
                {sellOrders && sellOrders.map(sellOrder => <div key={sellOrder.metaData.orderHash} className="orderbook-table-sell-row">
                  <div className="orderbook-table-sell-item orderbook-size-col">0.1585</div>
                  <div className="orderbook-table-sell-item orderbook-price-col">1892.7843060</div>
                  <div className="orderbook-table-sell-item orderbook-my-size-col"></div>
                </div>)}
              </div>
              <div className="orderbook-table-spread-row">
                <div className="orderbook-table-spread-item">Spread</div>
                <div className="orderbook-table-spread-value">0.0000000</div>
                <div className="orderbook-table-spread-value">0.00%</div>
              </div>
              <div className="orderbook-table-buy">
                {buyOrders && buyOrders.map(buyOrder => <div key={buyOrder.metaData.orderHash} className="orderbook-table-buy-row">
                  <div className="orderbook-table-buy-item orderbook-size-col">0.1585</div>
                  <div className="orderbook-table-buy-item orderbook-price-col">1892.7843060</div>
                  <div className="orderbook-table-buy-item orderbook-my-size"></div>
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
  orders: PropTypes.array,
}
export default withRouter(Orderbook)