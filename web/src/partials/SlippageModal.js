import './SlippageModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import Modal from 'react-bootstrap/Modal'
import SlippageConfig from './SlippageConfig'

class SlippageModal extends Component {
  
  render() {
    var { onClose } = this.props
    return <Modal className="steps-modal slippage-modal" backdrop="static" keyboard={false} centered={true} size="md" show={true} onHide={onClose}>
      <Modal.Header closeButton>
      </Modal.Header>
      <Modal.Body className="text-center">
        <SlippageConfig {...this.props}></SlippageConfig>
        <div className="action-btn mt-4" onClick={onClose}>OK</div>
      </Modal.Body>
    </Modal>
  }
}
export default withRouter(SlippageModal)