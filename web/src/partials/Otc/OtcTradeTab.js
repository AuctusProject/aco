import './OtcTradeTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import OtcTradeTabStep2 from './OtcTradeTabStep2'
import OtcTradeTabStep1 from './OtcTradeTabStep1'

class OtcTradeTab extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      selectedOption: null,
      step: 1
    }
  }

  componentDidMount = () => {
  }

  selectType = (type) => {
    this.setState({ selectedType: type })
  }

  onExpirationChange = (value) => {
    this.setState({expirationDate: value})
  }

  onStrikeChange = (value) => {
    this.setState({strikeValue: value})
  }

  getButtonMessage = () => {
    if (!this.state.selectedUnderlying) {
      return "Select underlying"
    }
    if (!this.state.expirationDate) {
      return "Select expiration"
    }
    if (!this.state.strikeValue) {
      return "Select strike"
    }
    return null
  }

  canProceed = () => {
    return (this.getButtonMessage() === null) 
  }

  onAssetSelected = (selectedAsset) => {
    this.setState({selectedUnderlying: selectedAsset})
  }

  setStep = (value) => {
    this.setState({step: value})
  }

  setSelectedOption = (selectedOption) => {
    this.setState({selectedOption: selectedOption})
  }

  render() {
    var minDate = new Date()
    var maxDate = new Date().setFullYear(new Date().getFullYear() + 1)
    return <div className="otc-trade-tab">
      {this.state.step === 1 && <OtcTradeTabStep1 selectedOption={this.state.selectedOption} setSelectedOption={this.setSelectedOption} setStep={this.setStep}></OtcTradeTabStep1>}
      {this.state.step === 2 && <OtcTradeTabStep2 selectedOption={this.state.selectedOption} setStep={this.setStep}></OtcTradeTabStep2>}
    </div>
  }
}

OtcTradeTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(OtcTradeTab)