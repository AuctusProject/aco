import './OtcTradeTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import DecimalInput from '../Util/DecimalInput'
import OptionBadge from '../OptionBadge'
import ReactDatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import AssetInput from '../Util/AssetInput'

class OtcTradeTabStep1 extends Component {
  constructor(props) {
    super(props)
    this.state = this.getInitialState(props)
  }

  getInitialState = (props) => {
    var state = { 
      selectedType: 1, 
      selectedUnderlying: null,
      expirationDate: "",
      strikeValue: "",
    }
    if (props.selectedOption) {
      state.selectedUnderlying = props.selectedOption.selectedUnderlying
      state.strikeValue = props.selectedOption.strikeValue
      state.selectedType = props.selectedOption.selectedType
      state.expirationDate = props.selectedOption.expirationDate
    }
    return state
  }

  selectType = (type) => {
    this.setState({ selectedType: type })
  }

  onExpirationChange = (value) => {
    if (value) {
      value.setUTCHours(8)
    }
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
    if (!this.state.strikeValue || this.state.strikeValue <= 0) {
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

  onNextClick = () => {
    var selectedOption = {}
    selectedOption.selectedUnderlying = this.state.selectedUnderlying
    selectedOption.strikeValue = this.state.strikeValue
    selectedOption.selectedType = this.state.selectedType
    selectedOption.expirationDate = this.state.expirationDate
    this.props.setSelectedOption(selectedOption)
    this.props.setStep(2)
  }

  getMinDate = () => {
    var date = new Date()
    date.setUTCHours(8,0,0,0)
    if (date < new Date()) {
      date.setDate(date.getDate() + 1)
    }
    return date
  }

  render() {
    var minDate = this.getMinDate()
    var maxDate = new Date().setFullYear(new Date().getFullYear() + 1)
    return <div>
      <div className="trade-title">
        Start a Trade
      </div>
      <div className="trade-subtitle">
        Select the terms for the option you would like to trade
      </div>
      <div className="inputs-wrapper">
        <div className="input-column underlying-column">
          <div className="input-label">Underlying</div>
          <div className="input-field">
            <AssetInput selectedAsset={this.state.selectedUnderlying} onAssetSelected={this.onAssetSelected}></AssetInput>
          </div>
        </div>
        <div className="input-column">
          <div className="input-label">Type</div>
          <div className="input-field type-toggle">
            <OptionBadge onClick={() => this.selectType(1)} className={this.state.selectedType === 1 ? "active" : "unselected"} isCall={true}/>
            <OptionBadge onClick={() => this.selectType(2)} className={this.state.selectedType === 2 ? "active" : "unselected"} isCall={false}/>
          </div>
        </div>
        <div className="input-column expiration-column">
          <div className="input-label">Expiration</div>
          <div className="input-field">
            <ReactDatePicker minDate={minDate} maxDate={maxDate} selected={this.state.expirationDate} onChange={this.onExpirationChange} />
          </div>
        </div>
        <div className="input-column strike-column">
          <div className="input-label">Strike</div>
          <div className="input-field">
            <DecimalInput tabIndex="-1" placeholder="" onChange={this.onStrikeChange} value={this.state.strikeValue}></DecimalInput>
          </div>
        </div>
      </div>
      <div className="action-button-wrapper">
        {this.canProceed() ?
        <div className="action-btn medium solid-blue" onClick={this.onNextClick}>
          <div>NEXT</div>
        </div> :
        <div className="action-btn medium solid-blue disabled">
          <div>{this.getButtonMessage()}</div>
        </div>}
      </div>
      <div className="otc-steps-indicator">
          <div className="active-step"></div>
          <div></div>
          <div></div>
      </div>
    </div>
  }
}

OtcTradeTabStep1.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(OtcTradeTabStep1)