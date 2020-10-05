import './SlippageModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import Modal from 'react-bootstrap/Modal'
import { formatPercentage } from '../util/constants'
import DecimalInput from './Util/DecimalInput'

const SLIPPAGE_OPTIONS = [0.01,0.03,0.05,0.1]

class SlippageModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      customValue: "",
      customValueError: "",
    }
  }

  componentDidMount = () => {
    this.setCustomValue()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.maxSlippage !== prevProps.maxSlippage) {
      this.setCustomValue()
    }
  }

  setCustomValue = () => {
    let value = ""
    if (!SLIPPAGE_OPTIONS.includes(this.props.maxSlippage)) {
      value = this.props.maxSlippage * 100
    }
    this.setState({customValue: value})
  }

  getSlippageOption = (value) => {
    var buttonClass = this.props.maxSlippage === value ? "btn-secondary" : "btn-outline-secondary"
    return <button onClick={() => this.onSlippageSelect(value)} class={"btn btn-sm mr-2 "+buttonClass}> {formatPercentage(value, 0)} </button>
  }

  onSlippageSelect = (value) => {
    this.setState({customValue: "", customValueError: ""})
    this.props.setMaxSlippage(value)
  }

  onCustomValueChange = (value) => {
    if (value > 50 || value < 0) {
      this.setState({customValue: "", customValueError: "Enter a valid slippage percentage"})
    }
    else {
      this.setState({customValue:value, customValueError: ""}, () => {
          this.props.setMaxSlippage(value/100.0)
      })
    }
  }

  getCustomInput = () => {
    return <div class="input-field">
      <DecimalInput tabIndex="-1" placeholder="Custom" onChange={this.onCustomValueChange} value={this.state.customValue}></DecimalInput>
      <div className="percentage-label">%</div>
    </div>
  }

  render() {
    var { onClose } = this.props
    return <Modal className="steps-modal slippage-modal" backdrop="static" keyboard={false} centered={true} size="md" show={true} onHide={onClose}>
      <Modal.Header closeButton>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-12">
            <div className="steps-container text-center">
              <div className="steps-modal-title">Slippage tolerance</div>
              <div className="slippage-options">
                {SLIPPAGE_OPTIONS.map((option => (
                  this.getSlippageOption(option)
                )))}
                {this.getCustomInput()}
              </div>
              <div className="error-alert">{this.state.customValueError}</div>
              <div className="aco-button action-btn" onClick={onClose}>OK</div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  }
}
export default withRouter(SlippageModal)