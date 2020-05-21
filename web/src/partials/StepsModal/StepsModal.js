import './StepsModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle } from '@fortawesome/free-regular-svg-icons'
import { faCheckCircle as faCheckCircleSolid } from '@fortawesome/free-solid-svg-icons'

class StepsModal extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  onHide = () => {
    if (this.props.isDone) {
      this.props.onDoneButtonClick()
    }
    else {
      this.props.onHide()
    }
  }

  render() {
    var { title, subtitle, img, steps, isDone, onDoneButtonClick, doneLabel } = this.props
    return <Modal className="steps-modal" backdrop="static" keyboard={false} centered={true} size="sm" show={true} onHide={this.onHide}>
      <Modal.Header closeButton>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-12">
            <div className="steps-container text-center">
              <div className="steps-modal-icon">{img}</div>
              <div className="steps-modal-title">{title}</div>
              <div className="steps-modal-subtitle">{subtitle}</div>
              {isDone && <div className="done-button-wrapper">
                <div className="aco-button action-btn" onClick={onDoneButtonClick}>{doneLabel ? doneLabel: "OK"}</div>
                </div>}
              {!isDone && <div className="steps">
                <div className="start-dot"></div>
                {steps.map((step, index) => (
                  <div className="step-item" key={index}>
                    <div className="step-container">
                      <div className={"step-title "+((step.active || step.progress >= 100) ? "step-title-active" : "")}>
                        {step.title}
                      </div>
                      <div className="step-line">
                        <div className="step-line-progress" style={{width: (step.progress ? (step.progress+'%') : '0')}}>
                        </div>
                      </div>
                    </div>
                    <div className={"step-dot "+(step.progress >= 100 ? "step-dot-done" : "")}>
                      <FontAwesomeIcon icon={(step.progress >= 100 ? faCheckCircleSolid : faCheckCircle)}></FontAwesomeIcon>
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  }
}

StepsModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(StepsModal)