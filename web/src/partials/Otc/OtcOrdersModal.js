import './OtcOrdersModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { getLocalOrders } from '../../util/constants'
import Loading from '../Util/Loading'

class OtcOrdersModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      orders: null
    }
  }

  componentDidMount = () => {
    var orders = getLocalOrders()
    this.setState({orders: orders})
  }

  onHideModal = () => {
    this.props.onHide()
  }

  onOrderSelect = (order) => () => {
    this.props.history.push('/otc/trade/' + order.orderId)
    this.props.onHide()
  }

  render() {
    return (
      <Modal className="otc-orders-modal aco-modal" centered={true} show={true} onHide={this.onHideModal}>
        <Modal.Header closeButton>
          Activity
        </Modal.Header>
        <Modal.Body>
          <div className="container">
            <div className="row">
              {!this.state.orders && <Loading></Loading>}
              {this.state.orders && this.state.orders.map(order => (
                <div key={order.orderId} className="col-md-12 otc-order" onClick={this.onOrderSelect(order)}>
                  {order.orderId}
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
  assetsImages: PropTypes.object
}
export default withRouter(OtcOrdersModal)