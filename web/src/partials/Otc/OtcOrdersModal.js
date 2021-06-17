import './OtcOrdersModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { fromDecimals, getLocalOrders, getTimeToExpiry, ONE_SECOND } from '../../util/constants'
import Loading from '../Util/Loading'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLongArrowAltRight } from '@fortawesome/free-solid-svg-icons'

class OtcOrdersModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      orders: null
    }
  }

  getCurrentAccount = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.selectedAccount.toLowerCase()
  }

  componentDidMount = () => {
    this.loadOrders()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.accountToggle !== prevProps.accountToggle) {
      this.loadOrders()
    }
  }

  loadOrders = () => {
    var otcOrders = getLocalOrders().filter(o => o.order.signer.responsible.toLowerCase() === this.getCurrentAccount())
    this.setState({otcOrders: otcOrders})
  }

  onHideModal = () => {
    this.props.onHide()
  }

  onOrderSelect = (order) => () => {
    this.props.history.push('/otc/trade/' + order.orderId)
    this.props.onHide()
  }

  getSignerValue = (otcOrder) => {
    var amount = otcOrder.order.signer.amount
    if (otcOrder.isAskOrder) {
      return fromDecimals(amount, otcOrder.option.selectedUnderlying.decimals) + " " + otcOrder.optionName
    }
    else {
      return fromDecimals(amount, 6) + " USDC"
    }
  }

  getSenderValue = (otcOrder) => {
    var amount = otcOrder.order.sender.amount
    if (!otcOrder.isAskOrder) {
      return fromDecimals(amount, otcOrder.option.selectedUnderlying.decimals) + " " + otcOrder.optionName
    }
    else {
      return fromDecimals(amount, 6) + " USDC"
    }
  }

  getTimeToExpiryOrder = (otcOrder) => {    
    if (this.isExpired(otcOrder)) {
      return "Expired"
    }
    var timeToExpiry = getTimeToExpiry(otcOrder.order.expiry)
    return (timeToExpiry.days > 0 ?
      `${timeToExpiry.days}d ${timeToExpiry.hours}h` :
      `${timeToExpiry.hours}h ${timeToExpiry.minutes}m`);
  }

  isExpired = (otcOrder) => {
    var timeToExpiry = getTimeToExpiry(otcOrder.order.expiry)
    var optionExpiration = otcOrder.option.expiryTime * ONE_SECOND
    return (timeToExpiry.days === 0 && timeToExpiry.hours === 0 && timeToExpiry.minutes === 0) ||
      optionExpiration < new Date().getTime()
  }

  render() {
    return (
      <Modal className="otc-orders-modal aco-modal" centered={true} show={true} onHide={this.onHideModal}>
        <Modal.Header closeButton>
          Orders
        </Modal.Header>
        <Modal.Body>
          <div className="container">
            <div className="row">
              {!this.state.otcOrders && <Loading></Loading>}
              {this.state.otcOrders && this.state.otcOrders.length === 0 && <div className="no-orders-message">No orders</div>}
              {this.state.otcOrders && this.state.otcOrders.map(otcOrder => (
                <div key={otcOrder.orderId} className="col-md-12 otc-order" onClick={this.onOrderSelect(otcOrder)}>
                  <div className="order-expiry">
                    {this.getTimeToExpiryOrder(otcOrder)}
                  </div>
                  <div className="order-summary">
                    <div className="signer-value">{this.getSignerValue(otcOrder)}</div>
                    <div className="right-arrow">
                      <FontAwesomeIcon icon={faLongArrowAltRight}/>
                    </div>
                    <div className="sender-value">{this.getSenderValue(otcOrder)}</div>
                  </div>                  
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>
      </Modal>
    )
  }
}
OtcOrdersModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(OtcOrdersModal)