import './UpdateIVModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { toDecimals } from '../../util/constants'
import { checkTransactionIsMined } from '../../util/web3Methods'
import StepsModal from '../StepsModal/StepsModal'
import DecimalInput from '../Util/DecimalInput'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { setBaseVolatility } from '../../util/acoPoolMethodsv3'

class UpdateIVModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: "",
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  onConfirmClick = () => {
    if (this.canConfirm()) {
      var stepNumber = 0
      var newVolatility = toDecimals(this.state.value / 100.0, 5)
      this.setStepsModalInfo(++stepNumber)
      setBaseVolatility(this.context.web3.selectedAccount, this.props.pool.address, newVolatility)
        .then(result => {
          if (result) {
            this.setStepsModalInfo(++stepNumber)
            checkTransactionIsMined(result)
              .then(result => {
                if (result) {
                  this.setStepsModalInfo(++stepNumber)
                }
                else {
                  this.setStepsModalInfo(-1)
                }
              })
              .catch(() => {
                this.setStepsModalInfo(-1)
              })
          }
          else {
            this.setStepsModalInfo(-1)
          }
        })
        .catch(() => {
          this.setStepsModalInfo(-1)
        })
    }
  }

  setStepsModalInfo = (stepNumber) => {
    var title = "Update IV"
    var subtitle = ""
    var img = null
    if (stepNumber === 1) {
      subtitle = "Confirm on " + this.context.web3.name + " to send update transaction."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 2) {
      subtitle = "Updating IV..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = "You have successfully updated."
      img = <DoneLargeIcon />
    }
    else if (stepNumber === -1) {
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon />
    }

    var steps = []
    steps.push({ title: "Update", progress: stepNumber > 2 ? 100 : 0, active: true })
    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        steps: steps,
        img: img,
        isDone: (stepNumber === 3 || stepNumber === -1),
        onDoneButtonClick: (stepNumber === 3 ? this.onDoneButtonClick : this.onHideStepsModal)
      }
    })
  }

  onDoneButtonClick = () => {
    this.setState({ stepsModalInfo: null })
    this.props.onHide(true)
  }

  onHideStepsModal = () => {
    this.setState({ stepsModalInfo: null })
  }

  getButtonMessage = () => {
    if (!this.state.value || this.state.value <= 0) {
      return "Enter a value"
    }
    return null
  }

  canConfirm = () => {
    return (this.getButtonMessage() === null)
  }

  onValueChange = (value) => {
    this.setState({ value: value })
  }

  render() {
    return (<Modal className="aco-modal deposit-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Header closeButton>UPDATE IV</Modal.Header>
      <Modal.Body>
        <div className="exercise-action">
          <div className="confirm-card">
            <div className="confirm-card-body">
              <div className="input-row">
                <div className="input-column">
                  <div className="input-label">New IV</div>
                  <div className="input-field">
                    <DecimalInput tabIndex="-1" onChange={this.onValueChange} value={this.state.value}></DecimalInput>
                    <div className="coin-symbol">%</div>
                  </div>
                </div>
              </div>
              <div className="card-separator"></div>
            </div>
            <div className="confirm-card-actions">
              <div className="aco-button cancel-btn" onClick={() => this.props.onHide(false)}>Go back</div>
              <div className={"aco-button action-btn " + (this.canConfirm() ? "" : "disabled")} onClick={this.onConfirmClick}>Confirm</div>
            </div>
          </div>
          {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
        </div>
      </Modal.Body>
    </Modal>)
  }
}

UpdateIVModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(UpdateIVModal)