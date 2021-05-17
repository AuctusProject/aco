import './OpenOrders.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

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

  }

  getUserOrders = () => {    
    var userAddress = this.context && this.context.web3 && this.context.web3.selectedAccount
    return this.context.orders.filter(o => o.order.maker.toLowerCase() === userAddress.toLowerCase())
  }
  
  render() {
    var userOrders = this.getUserOrders()
    var isBuy = false

    
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
                <th className="orders-table-header-item orders-table-number-col">Filled</th>
                <th className="orders-table-header-item orders-table-number-col">Price (USDC)</th>
                <th className="orders-table-header-item orders-table-text-col">Status</th>
                <th className="orders-table-header-item orders-table-text-col">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {userOrders && userOrders.map(order => 
              <tr>
                <td className="orders-table-text-col">
                  {order.order.makerToken === this.props.option.acoToken ?
                    <div className="order-type-buy">Buy</div> :
                    <div className="order-type-sell">Sell</div>
                  }                  
                </td>
                <td className="orders-table-number-col">2.75</td>
                <td className="orders-table-number-col">0.00</td>
                <td className="orders-table-number-col">109.1412000</td>
                <td className="orders-table-text-col">Open</td>
                <td className="orders-table-text-col">
                  <FontAwesomeIcon icon={faTimes} onClick={this.cancelOrder(order)} title="Cancel Order"></FontAwesomeIcon>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
    </div>
    );
  }
}

OpenOrders.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(OpenOrders)