import './OpenOrders.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { fromDecimals } from '../../util/constants'
import CancelAdvancedOrderModal from './CancelAdvancedOrderModal'

class OpenOrders extends Component {
  constructor() {
    super()
    this.state = {}
  }
  
  componentDidUpdate = (prevProps) => {
  }

  componentDidMount = () => {
    
  }

  cancelOrder = (order) => () => {
    this.setState({cancelOrderData: order.order})
  }

  getUserOrders = () => {    
    var userAddress = this.context && this.context.web3 && this.context.web3.selectedAccount
    var userOrders = []
    if (this.context.orderbook) {
      if (this.context.orderbook && this.context.orderbook.ask && this.context.orderbook.ask.orders) {
        var askOrders = this.context.orderbook.ask.orders.filter(o => o.order && o.order.maker && o.order.maker.toLowerCase() === userAddress.toLowerCase())
        userOrders = userOrders.concat(askOrders)
      }
      if (this.context.orderbook && this.context.orderbook.bid && this.context.orderbook.bid.orders) {
        var bidOrders = this.context.orderbook.bid.orders.filter(o => o.order && o.order.maker && o.order.maker.toLowerCase() === userAddress.toLowerCase())
        userOrders = userOrders.concat(bidOrders)
      }
    }
    return userOrders
  }

  formatSize = (size) => {
    return fromDecimals(size, this.props.option.acoTokenInfo.decimals)
  }

  formatPrice = (price) => {
    return fromDecimals(price, this.props.option.strikeAssetInfo.decimals)
  }  

  onCancelOrderHide = (completed) => {
    this.setState({ cancelOrderData: null })
  }
  
  render() {
    var userOrders = this.getUserOrders()
    
    return (
      <div className="orders-box">
        <div className="box-title-wrapper">
          <h1 className="box-title">Orders</h1>
        </div>
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead className="orders-table-header">
              <tr>
                <th className="orders-table-header-item orders-table-text-col">Type</th>
                <th className="orders-table-header-item orders-table-number-col">Amount</th>
                <th className="orders-table-header-item orders-table-number-col">Remaining</th>
                <th className="orders-table-header-item orders-table-number-col">Price (USDC)</th>
                <th className="orders-table-header-item orders-table-text-col">Status</th>
                <th className="orders-table-header-item orders-table-text-col">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {userOrders && userOrders.map(order => 
              <tr key={order.orderHash}>
                <td className="orders-table-text-col">
                  {order.order.takerToken === this.props.option.acoToken ?
                    <div className="order-type-buy">Buy</div> :
                    <div className="order-type-sell">Sell</div>
                  }                  
                </td>
                <td className="orders-table-number-col">{this.formatSize(order.order.takerToken === this.props.option.acoToken ? order.order.takerAmount : order.order.makerAmount)}</td>
                <td className="orders-table-number-col">{this.formatSize(order.acoAmount)}</td>                
                <td className="orders-table-number-col">{this.formatPrice(order.price)}</td>
                <td className="orders-table-text-col">Open</td>
                <td className="orders-table-text-col">
                  <FontAwesomeIcon className="clickable" icon={faTimes} onClick={this.cancelOrder(order)} title="Cancel Order"></FontAwesomeIcon>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {this.state.cancelOrderData && <CancelAdvancedOrderModal cancelOrderData={this.state.cancelOrderData} onHide={this.onCancelOrderHide} ></CancelAdvancedOrderModal>}
    </div>
    );
  }
}

OpenOrders.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object,
  orderbook: PropTypes.object
}
export default withRouter(OpenOrders)