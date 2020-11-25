import './OtcTradeTabStep2.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import DecimalInput from '../Util/DecimalInput'
import OptionBadge from '../OptionBadge'
import ReactDatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import AssetInput from '../Util/AssetInput'
import SimpleDropdown from '../SimpleDropdown'

var ACTION_OPTIONS = [{
  value:1,
  name:"Buy"
},
{
  value:2,
  name:"Sell"
}]
var EXPIRATION_OPTIONS = [{
  value:1,
  name:"Minute"
},
{
  value:2,
  name:"Hour"
},
{
  value:3,
  name:"Day"
},
{
  value:4,
  name:"Week"
},
{
  value:5,
  name:"Month"
}]

class OtcTradeTabStep2 extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      actionType: ACTION_OPTIONS[0], 
      optionQty: "",
      usdcValue: "",
      counterpartyAddress: "",
      expirationValue: "",
      expirationUnit: EXPIRATION_OPTIONS[0]
    }
  }

  selectActionType = (type) => {
    this.setState({ actionType: type })
  }

  onOptionQtyChange = (value) => {
    this.setState({optionQty: value})
  }

  onUsdcValueChange = (value) => {
    this.setState({usdcValue: value})
  }

  onCounterpartyAddressChange = (value) => {
    this.setState({counterpartyAddress: value})
  }

  onExpirationValueChange = (value) => {
    this.setState({expirationValue: value})
  }

  onExpirationUnitChange = (value) => {
    this.setState({expirationUnit: value})
  }

  getButtonMessage = () => {
    if (!this.state.optionQty || this.state.optionQty <= 0) {
      return "Enter quantity"
    }
    if (!this.state.usdcValue || this.state.usdcValue <= 0) {
      return "Enter USDC value"
    }
    if (!this.state.expirationValue) {
      return "Select expiration"
    }
    return null
  }

  getOptionName = () => {
    var selectedOption = this.props.selectedOption
    return "ACO " + 
    selectedOption.selectedUnderlying.symbol +
    "-" +
    selectedOption.strikeValue + 
    "USDC-" +
    (selectedOption.selectedType === "1" ? "C" : "P") +
    "-" +
    this.getFormattedDate()
  }  

  getFormattedDate = () => {
    var expirationDate = new Date(this.props.selectedOption.expirationDate)
    var day = expirationDate.getUTCDate()
    var month = expirationDate.toLocaleString('en', { month: 'short', timeZone: 'UTC' }).toUpperCase()
    var year = expirationDate.getUTCFullYear() % 2000
    return day + month + year + "-0800UTC"
  }

  canProceed = () => {
    return (this.getButtonMessage() === null) 
  }

  onAssetSelected = (selectedAsset) => {
    this.setState({selectedUnderlying: selectedAsset})
  }

  onNextClick = () => {
    
  }

  onModifyClick = () => {
    this.props.setStep(1)
  }

  render() {
    var minDate = new Date()
    var maxDate = new Date().setFullYear(new Date().getFullYear() + 1)
    return <div className="otc-trade-tab">
      <div className="trade-title">
        Start a trade
      </div>
      <div className="trade-subtitle">
        Select the quantity, price and expiration for your trade
      </div>
      <div className="selected-option-row">
        <div className="selected-option-label">Selected Option:</div>
        <div className="selected-option-name">{this.getOptionName()}</div>
        <div className="selected-option-modify" onClick={this.onModifyClick}>MODIFY</div>
      </div>
      <div className="inputs-wrapper">
        <div className="input-column">
          <div className="input-label">Action (You'll)</div>
          <div className="input-field">
            <SimpleDropdown selectedOption={this.state.actionType} options={ACTION_OPTIONS} onSelectOption={this.selectActionType}></SimpleDropdown>
          </div>
        </div>
        <div className="input-column expiration-column">
          <div className="input-label">Quantity</div>
          <div className="input-field">
            <DecimalInput tabIndex="-1" placeholder="" onChange={this.onOptionQtyChange} value={this.state.optionQty}></DecimalInput>
          </div>
        </div>
        <div className="label-column">
          <div className="label-text">
            with
          </div>
        </div>
        <div className="input-column strike-column">
          <div className="input-label"></div>
          <div className="input-field">
            <DecimalInput tabIndex="-1" placeholder="" onChange={this.onUsdcValueChange} value={this.state.usdcValue}></DecimalInput>
          </div>
        </div>
        <div className="label-column">
          <div className="label-text">
          USDC
          </div>
        </div>
      </div>
      <div className="inputs-wrapper">
        <div>
          <input onChange={this.onCounterpartyAddressChange} value={this.state.counterpartyAddress} placeholder="Counterparty wallet (Recommended)"></input>
        </div>
        <div>
          <input onChange={this.onExpirationValueChange} value={this.state.expirationValue}></input>
          <SimpleDropdown selectedOption={this.state.expirationUnit} options={EXPIRATION_OPTIONS} onSelectOption={this.onExpirationUnitChange}></SimpleDropdown>
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
    </div>
  }
}

OtcTradeTabStep2.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(OtcTradeTabStep2)