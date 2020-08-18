import './VerifyModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

class VerifyModal extends Component {
  constructor(props) {
    super(props)
    this.state = {loading: false}
  }

  onConfirm = () => {
    this.setState({loading: true}, this.props.onConfirm)
  }

  render() {
    var { onCancel, onRefresh, description, timedOut } = this.props
    var subtitle = timedOut ? "Exchange rates were expired. Please click refresh and try again." : description
    return <Modal className="steps-modal verify-modal" backdrop="static" keyboard={false} centered={true} size="sm" show={true} onHide={onCancel}>
      <Modal.Header closeButton>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-12">
            <div className="steps-container text-center">
              <div className="steps-modal-title">Verify Exchange Rate</div>
              <div className="steps-modal-subtitle">{subtitle}</div>
              {timedOut && <div className="done-button-wrapper">
                <div className="aco-button action-btn" onClick={onRefresh}>Refresh</div>
              </div>}
              {!timedOut && <>
                <div className="gas-disclaimer">
                  <div><FontAwesomeIcon icon={faExclamationTriangle}/></div>
                  <span>Don't change transaction GAS PRICE in Metamask / Web3 wallet!</span></div>
                <div className="done-button-wrapper">
                  <div className="aco-button cancel-btn" onClick={onCancel}>Cancel</div>
                  {!this.state.loading && <div className="aco-button action-btn" onClick={this.onConfirm}>Verify</div>}
                  {this.state.loading && <div className="aco-button action-btn disabled">Verifying...</div>}
                </div>
              </>}
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  }
}

VerifyModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(VerifyModal)