import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { formatPercentage } from '../util/constants'
import DecimalInput from './Util/DecimalInput'

const SLIPPAGE_OPTIONS = [0.01,0.03,0.05]

class SlippageConfig extends Component {
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
    if (this.props.slippage !== prevProps.slippage) {
      this.setCustomValue()
    }
  }

  setCustomValue = () => {
    let value = ""
    if (!SLIPPAGE_OPTIONS.includes(this.props.slippage)) {
      value = this.props.slippage * 100
    }
    this.setState({customValue: value})
  }

  getSlippageOption = (value) => {
    var buttonClass = this.props.slippage === value ? "action-btn" : "outline-btn"
    return <div key={value} onClick={() => this.onSlippageSelect(value)} className={"m-1 "+buttonClass}> {formatPercentage(value, 0)} </div>
  }

  onSlippageSelect = (value) => {
    this.setState({customValue: "", customValueError: ""})
    this.props.setSlippage(value)
  }

  onCustomValueChange = (value) => {
    if (value > 50 || value < 0) {
      this.setState({customValue: "", customValueError: "Enter a valid slippage percentage"})
    }
    else {
      this.setState({customValue:value, customValueError: ""}, () => {
        this.props.setSlippage(value/100.0)
      })
    }
  }

  getCustomInput = () => {
    return <div className="input-field">
      <DecimalInput tabIndex="-1" placeholder="Custom" onChange={this.onCustomValueChange} value={this.state.customValue}></DecimalInput>
      <div className="percentage-label">%</div>
    </div>
  }

  render() {
    return <div className="row">
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
        </div>
      </div>
    </div>
  }
}
export default withRouter(SlippageConfig)