import './OtcTradeTabStep2.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Web3Utils from 'web3-utils'
import DecimalInput from '../Util/DecimalInput'
import SimpleDropdown from '../SimpleDropdown'
import { formatWithPrecision, getBalanceOfAsset, isEther, ONE_MINUTE, OTC_ACTION_OPTIONS, OTC_EXPIRATION_OPTIONS, saveToLocalOrders, toDecimals } from '../../util/constants'
import CreateOrderModal from './CreateOrderModal'
import { faUserCircle, faClock } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalculator } from '@fortawesome/free-solid-svg-icons'
import CalculatorModal from './CalculatorModal'
import { usdcAddress, wethAddress } from '../../util/network'

class OtcTradeTabStep2 extends Component {
  constructor(props) {
    super(props)
    this.state = {
      actionType: OTC_ACTION_OPTIONS[0],
      optionQty: "",
      usdcValue: "",
      counterpartyAddress: "",
      expirationValue: "10",
      expirationUnit: OTC_EXPIRATION_OPTIONS[0]
    }
  }

  componentDidMount = () => {
    this.loadAssetsBalances()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.accountToggle !== prevProps.accountToggle) {
      this.loadAssetsBalances()
    }
  } 

  loadAssetsBalances = () => {
    this.setState({wethBalance: null, assetToPayBalance: null, signerAssetToPayBalance: null})
    var userAddress = this.context && this.context.web3 && this.context.web3.selectedAccount
    var underlyingAddress = this.getUnderlyingAddress()
    if (userAddress && underlyingAddress) {
      if (isEther(underlyingAddress)) {
        getBalanceOfAsset(wethAddress(), userAddress).then(wethBalance => {
          this.setState({ wethBalance: wethBalance })
        })
      }
      getBalanceOfAsset(underlyingAddress, userAddress).then(underlyingBalance => {
        this.setState({ underlyingBalance: underlyingBalance })
      })
      getBalanceOfAsset(usdcAddress(), userAddress).then(usdcBalance => {
        this.setState({usdcBalance: usdcBalance})
      })
    }
  }

  getUnderlyingAddress = () => {
    if (this.props.selectedOption && this.props.selectedOption.selectedUnderlying) {
      return this.props.selectedOption.selectedUnderlying.address
    }
  }

  selectActionType = (type) => {
    this.setState({ actionType: type })
  }

  onOptionQtyChange = (value) => {
    this.setState({ optionQty: value })
  }

  onUsdcValueChange = (value) => {
    this.setState({ usdcValue: value })
  }

  onCounterpartyAddressChange = (event) => {
    this.setState({ counterpartyAddress: event.target.value })
  }

  onExpirationValueChange = (value) => {
    this.setState({ expirationValue: value })
  }

  onExpirationUnitChange = (value) => {
    this.setState({ expirationUnit: value })
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
    if (this.props.isConnected && !this.hasBalanceToCreate()) {
      return "Insufficient funds"
    }
    return null
  }

  canProceed = () => {
    return (this.getButtonMessage() === null)
  }

  onCreateClick = () => {
    var isAsk = this.state.actionType === OTC_ACTION_OPTIONS[1]
    var orderData = {
      isAsk: isAsk,
      selectedOption: this.props.selectedOption,
      optionQty: toDecimals(this.state.optionQty, this.props.selectedOption.selectedUnderlying.decimals),
      usdcValue: toDecimals(this.state.usdcValue, 6),
      expiry: this.getExpiry(),
      counterpartyAddress: this.state.counterpartyAddress
    }
    this.setState({ createOrderModal: orderData })
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  getExpiry = () => {
    var now = Date.now()
    if (this.state.expirationUnit.value === 1) {
      now = now + (this.state.expirationValue * ONE_MINUTE)
    }
    else if (this.state.expirationUnit.value === 2) {
      now = now + (this.state.expirationValue * 60 * ONE_MINUTE)
    }
    else if (this.state.expirationUnit.value === 3) {
      now = now + (this.state.expirationValue * 24 * 60 * ONE_MINUTE)
    }
    else if (this.state.expirationUnit.value === 4) {
      now = now + (this.state.expirationValue * 7 * 24 * 60 * ONE_MINUTE)
    }
    else if (this.state.expirationUnit.value === 5) {
      now = now + (this.state.expirationValue * 30 * 24 * 60 * ONE_MINUTE)
    }
    return Math.ceil(now / 1000)
  }

  onModifyClick = () => {
    this.props.setStep(1)
  }

  getPremiumPerOption = () => {
    if (this.state.optionQty && this.state.usdcValue && this.state.optionQty > 0 && this.state.usdcValue > 0) {
      var premiumPerOption = this.state.usdcValue / this.state.optionQty
      return "(" + formatWithPrecision(premiumPerOption, 2) + "/option)"
    }
    return null
  }

  getUSDCToCollaterize = () => {
    return this.state.optionQty * this.props.selectedOption.strikeValue
  }

  onCreated = (result) => {
    saveToLocalOrders({...result, ...{optionName: this.getOptionName(), option: this.props.selectedOption}})
    this.props.setStep(3, result)
    this.props.history.push('/otc/trade/' + result.orderId)
    this.onCreateOrderHide()
  }

  onCreateOrderHide = () => {
    this.setState({ createOrderModal: null })
  }

  getOptionName = () => {
    var selectedOption = this.props.selectedOption
    return "ACO " +
      selectedOption.selectedUnderlying.symbol +
      "-" +
      selectedOption.strikeValue +
      "USDC-" +
      (selectedOption.selectedType === 1 ? "C" : "P") +
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

  getAmountToPay = () => {
    if (this.state.actionType === OTC_ACTION_OPTIONS[0]) 
      return toDecimals(this.state.usdcValue, 6)
    else if (this.props.selectedOption.selectedType === 1)
      return toDecimals(this.state.optionQty, this.props.selectedOption.selectedUnderlying.decimals)
    else
      return toDecimals(this.getUSDCToCollaterize(), 6)
  }

  getAssetToPay = () => {
    if (this.state.actionType === OTC_ACTION_OPTIONS[1] && this.props.selectedOption.selectedType === 1)
      return this.props.selectedOption.selectedUnderlying.address
    else
      return usdcAddress()
  }

  hasBalanceToCreate = () => {
    var amountToPay = this.getAmountToPay()
    var assetToPay = this.getAssetToPay()
    if (assetToPay.toLowerCase() === usdcAddress().toLowerCase()) {
      return new Web3Utils.BN(this.state.usdcBalance).gte(new Web3Utils.BN(amountToPay))
    }
    else if (isEther(assetToPay)) {
      return new Web3Utils.BN(this.state.wethBalance).gte(new Web3Utils.BN(amountToPay)) ||
      new Web3Utils.BN(this.state.underlyingBalance).gte(new Web3Utils.BN(amountToPay))
    }
    else {
      return new Web3Utils.BN(this.state.underlyingBalance).gte(new Web3Utils.BN(amountToPay))
    }
  }

  onCalcClick = () => {
    this.setState({
      calcModal: {
        selectedOption: this.props.selectedOption
      }
    })
  }

  onCalcModalHide = (priceData) => {
    var usdcValue = this.state.usdcValue
    if (priceData) {
      if (this.state.optionQty > 0) {
        usdcValue = this.state.optionQty * priceData
      }
      else {
        usdcValue = priceData
      }
      usdcValue = usdcValue.toFixed(2)
    }
    this.setState({calcModal: null, usdcValue: usdcValue})
  }

  render() {
    return <div>
      <div className="trade-title">
        Start a Trade
      </div>
      <div className="trade-subtitle">
        Select the quantity, price and expiration for your trade
      </div>
      <div className="selected-option-row">
        <div className="selected-option-label">Selected Option:</div>
        <div className="selected-option-name">{this.getOptionName()}</div>
        <div className="selected-option-modify" onClick={this.onModifyClick}>MODIFY</div>
      </div>
      <div className="inputs-wrapper action-row">
        <div className="input-column">
          <div className="input-label">Action (You'll)</div>
          <div className="input-field">
            <SimpleDropdown selectedOption={this.state.actionType} options={OTC_ACTION_OPTIONS} onSelectOption={this.selectActionType}></SimpleDropdown>
          </div>
        </div>
        <div className="input-column">
          <div className="input-label">Quantity</div>
          <div className="input-field">
            <DecimalInput placeholder="0.00" onChange={this.onOptionQtyChange} value={this.state.optionQty}></DecimalInput>
          </div>
        </div>
        <div className="label-column">
          <div className="label-text">
            {this.state.actionType === 1 ? "with" : "for"}
          </div>
        </div>
        <div className="input-column">
          <div className="input-label"></div>
          <div className="input-field">
            <DecimalInput placeholder="0.00" onChange={this.onUsdcValueChange} value={this.state.usdcValue}></DecimalInput>
            <div className="calc-icon" onClick={this.onCalcClick}><FontAwesomeIcon icon={faCalculator}></FontAwesomeIcon></div>
          </div>
        </div>
        <div className="label-column">
          <div className="label-text">
            USDC
          </div>
        </div>
      </div>
      <div className="inputs-wrapper counterparty-expiry-row">
        <div className="counterparty-expiry">
          <FontAwesomeIcon icon={faUserCircle}></FontAwesomeIcon>
          <div className="input-field counterparty-input">
            <input onChange={this.onCounterpartyAddressChange} value={this.state.counterpartyAddress} placeholder="Counterparty wallet (Recommended)"></input>
          </div>
        </div>
        <div className="counterparty-expiry">
          <FontAwesomeIcon icon={faClock}></FontAwesomeIcon>
          <div className="nowrap">Expires in</div>
          <div className="input-field expiry-input">
            <DecimalInput placeholder="" onChange={this.onExpirationValueChange} value={this.state.expirationValue}></DecimalInput>
          </div>
          <SimpleDropdown isPlural={this.state.expirationValue > 1} selectedOption={this.state.expirationUnit} options={OTC_EXPIRATION_OPTIONS} onSelectOption={this.onExpirationUnitChange}></SimpleDropdown>
        </div>
      </div>
      <div className="collateral-and-premium-info">
        {this.state.actionType === OTC_ACTION_OPTIONS[0] ? <div>
          Total premium to be paid: {this.state.usdcValue ? <>{this.state.usdcValue} USDC {this.getPremiumPerOption()}</> : "-"}
        </div> :
          <>{this.props.selectedOption.selectedType === 1 ?
            <div>{this.props.selectedOption.selectedUnderlying.symbol} to collaterize: {this.state.optionQty ? this.state.optionQty : "-"}</div> :
            <div>USDC to collaterize: {this.getUSDCToCollaterize() ? this.getUSDCToCollaterize() : "-"}</div>
          }
            <div>Total premium to be received: {this.state.usdcValue ? <>{this.state.usdcValue} USDC {this.getPremiumPerOption()}</> : "-"}</div>
          </>}
      </div>
      <div className="action-button-wrapper">
        {this.canProceed() ?
          (this.props.isConnected ? 
            <div className="action-btn medium solid-blue" onClick={this.onCreateClick}>
              <div>CREATE TRADE</div>
            </div> :
            <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
              <div>CONNECT WALLET</div>
            </div>)
          :
          <div className="action-btn medium solid-blue disabled">
            <div>{this.getButtonMessage()}</div>
          </div>}
      </div>
      <div className="otc-steps-indicator">
        <div></div>
        <div className="active-step"></div>
        <div></div>
      </div>
      {this.state.createOrderModal && <CreateOrderModal {...this.props} createOrderData={this.state.createOrderModal} onHide={this.onCreateOrderHide} onCreated={this.onCreated} />}
      {this.state.calcModal && <CalculatorModal {...this.props} calcModal={this.state.calcModal} onHide={this.onCalcModalHide}/>}
    </div>
  }
}

OtcTradeTabStep2.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(OtcTradeTabStep2)