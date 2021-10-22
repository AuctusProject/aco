import './CreateOption.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import ReactDatePicker from 'react-datepicker'
import OptionBadge from '../partials/OptionBadge'
import { ONE_SECOND, toDecimals, fromDecimals, formatWithPrecision, ModeView } from '../util/constants'
import SimpleAssetDropdown from '../partials/SimpleAssetDropdown'
import StrikeValueInput from '../partials/Util/StrikeValueInput'
import { getAvailablePoolsForNonCreatedOption } from '../util/contractHelpers/acoPoolFactoryMethods'
import BigNumber from 'bignumber.js'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import CreateOptionModal from '../partials/CreateOptionModal'
import { confirm } from '../util/sweetalert'
import { getAvailableOptionsByPair } from '../util/dataController'
import { usdAddress, usdSymbol, usdAsset, menuConfig } from '../util/network'
import { getAcoAssets } from '../util/baseApi'

class CreateOption extends Component {
  constructor(props) {
    super(props)
    this.state = this.getInitialState(props)
  }

  getInitialState = (props) => {
    var state = { 
      selectedType: 1, 
      selectedUnderlying: null,
      expirationDate: "",
      selectedStrike: "",
      strikeOptions: null,
      loadingLiquidity: false
    }
    return state
  }

  componentDidMount = () => {
    this.refreshUnderlyingAssets()
  }

  refreshUnderlyingAssets = () => {
    getAcoAssets().then(assets => {
      var filteredAssets = assets.filter(a => 
        a.createAco
      ).map(a => {return {
        value: a.symbol,
        name: a.symbol,
        icon: a.imageUrl
      }})
      this.setState({underlyingOptions: filteredAssets})
    })
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.componentDidMount()
    }
  }

  selectType = (type) => {
    this.setState({ selectedType: type }, this.checkSelectedOption)
  }

  onExpirationChange = (value) => {
    if (value) {
      value.setUTCHours(8,0,0,0)
    }
    this.setState({expirationDate: value}, this.checkSelectedOption)
  }

  onStrikeSelected  = (value) => {
    this.setState({selectedStrike: value}, this.checkSelectedOption)
  }

  checkSelectedOption = () => {
    if (this.state.selectedUnderlying && this.state.selectedType && this.state.selectedStrike && this.state.expirationDate) {
      var pair = {
        underlyingSymbol: this.state.selectedUnderlying.name,
        strikeAssetSymbol: usdSymbol(),
      }
      let usd = usdAsset()
      getAvailableOptionsByPair(pair, this.state.selectedType).then(options => {      
        var filteredOptions = options.filter(o => 
          o.strikePrice === toDecimals(this.state.selectedStrike.value, usd.decimals).toString() &&
          o.expiryTime.toString() === (this.state.expirationDate.getTime()/ONE_SECOND).toString())
        if (filteredOptions && filteredOptions.length === 1) {
          this.setState({selectedOption: filteredOptions[0]})
          this.checkLiquidity()
        }    
        else {
          this.setState({selectedOption: null})
          this.checkLiquidity()
        }
      })
    }
    else {
      this.setState({selectedOption: null, optionsLiquidity: null})
    }    
  }

  getSelectedUnderlyingAddress = () => {
    var underlyingAsset = this.getSelectedUnderlyingAsset()
    return underlyingAsset && underlyingAsset.address
  }

  getSelectedUnderlyingAsset = () => {
    var assets = this.state.assets
    var symbol = this.state.selectedUnderlying.value
    for (let i = 0; i < assets.length; ++i) {
      if (assets[i].symbol.toLowerCase() === symbol.toLowerCase()) {
        return assets[i].address
      }
    }
  }

  getOptionData = () => {
    let usd = usdAsset()
    let underlying = this.getSelectedUnderlyingAddress()
    return {
      underlying: underlying,
      strikeAsset: usdAddress(),
      isCall: this.state.selectedType === 1,
      expiryTime: (this.state.expirationDate.getTime()/ONE_SECOND).toString(),
      strikePrice: toDecimals(this.state.selectedStrike.value, usd.decimals).toString()
    }
  }

  getCurrentUnderlyingPrice = () => {
    var underlyingPrice = this.context.ticker && this.context.ticker[this.state.selectedUnderlying.value]
    return underlyingPrice
  }

  checkLiquidity = () => {
    this.setState({loadingLiquidity: true, optionsLiquidity: null})
    var optionData = this.getOptionData()
    getAvailablePoolsForNonCreatedOption(this.getOptionData(), this.getCurrentUnderlyingPrice()).then(pools => {
      var totalLiquidity = new BigNumber(0)
      for (let index = 0; index < pools.length; index++) {
        const pool = pools[index];
        totalLiquidity = totalLiquidity.plus(new BigNumber(this.state.selectedType === 1 ? 
          pool.underlyingBalance : 
          pool.strikeAssetBalance))
      }
      var convertedTotalLiquidity = Number(fromDecimals(totalLiquidity, this.getPoolLiquidityDecimals()))
      var usd = usdAsset()
      var optionsLiquidity = this.state.selectedType === 1 ? convertedTotalLiquidity : 
        convertedTotalLiquidity/Number(fromDecimals(optionData.strikePrice, usd.decimals))
      this.setState({optionsLiquidity: optionsLiquidity, loadingLiquidity: false})
    })
  }

  getTotalLiquidityFormatted = () => {
    if (this.state.loadingLiquidity) {
      return <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>
    }
    var formattedLiquidity = "-"
    if (this.state.optionsLiquidity) {
      formattedLiquidity = formatWithPrecision(this.state.optionsLiquidity, 2) + " options"
    }    
    return formattedLiquidity 
  }

  getPoolLiquidityDecimals = () => {
    if (this.state.selectedType !== 1) {
      let usd = usdAsset()
      return usd.decimals
    }
    var underlyingAsset = this.getSelectedUnderlyingAsset()
    return underlyingAsset && underlyingAsset.decimals
  }

  getPoolLiquiditySymbol = () => {
    if (this.state.selectedType !== 1) {
      return usdSymbol()
    }
    return this.state.selectedUnderlying.value
  }

  getButtonMessage = () => {
    if (!this.state.selectedUnderlying) {
      return "Select underlying"
    }
    if (!this.state.expirationDate) {
      return "Select expiration"
    }
    if (!this.state.selectedStrike) {
      return "Select strike"
    }
    if (this.state.selectedOption) {
      return "Option already exists"
    }
    return null
  }

  canProceed = () => {
    return (this.getButtonMessage() === null) 
  }

  onAssetSelected = (selectedAsset) => {
    this.setState({selectedUnderlying: selectedAsset}, this.checkSelectedOption)
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  getMinDate = () => {
    var date = new Date()
    date.setUTCHours(8,0,0,0)
    if (date < new Date()) {
      date.setDate(date.getDate() + 1)
    }
    return date
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  onCreateClick = () => {
    if (this.state.optionsLiquidity > 0) {
      this.setState({createOption: true})
    }
    else {
      var alertText = "There's no liquidity for the option you would create, are you sure you want to proceed?"
      confirm(null, (result) => {
        if (result) {
          this.setState({createOption: true})
        }
      }, null, "ALERT", "Yes", "No", alertText)
    }    
  }

  onCreateOptionHide = (completed) => {
    this.setState({ createOption: null })
    if (completed) {
      this.props.history.push(menuConfig().hasAdvanced && this.props.modeView === ModeView.Advanced ? "/advanced/trade" : "/buy")
    }
  }

  render() {    
    var minDate = this.getMinDate()
    var maxDate = new Date().setFullYear(new Date().getFullYear() + 1)
    
    return <div className="py-4 create-option-content">
        <div className="page-title">CREATE OPTION</div>
        <div className="page-subtitle">Select the terms for the option you would like to create</div>
        <div className="otc-trade-tab">
          <div className="inputs-wrapper">
            <div className="input-column underlying-column">
              <div className="input-label">Underlying</div>
              <div className="input-field">
                <SimpleAssetDropdown placeholder="Select underlying" selectedOption={this.state.selectedUnderlying} options={this.state.underlyingOptions} onSelectOption={this.onAssetSelected}/>
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
                <ReactDatePicker placeholderText="Select expiration" dateFormat="yyyy/MM/dd" minDate={minDate} maxDate={maxDate} selected={this.state.expirationDate} onChange={this.onExpirationChange} />
              </div>
            </div>
            <div className="input-column strike-column">
              <div className="input-label">Strike</div>
              <div className="input-field">
                {(this.state.selectedUnderlying) ? 
                  <StrikeValueInput selectedUnderlying={this.state.selectedUnderlying} selectedType={this.state.selectedType} selectedStrike={this.state.selectedStrike} onStrikeSelected={this.onStrikeSelected}/>
                  :
                  <span className="simple-dropdown-placeholder">Select underlying first</span>
                }
              </div>
            </div>
          </div>
          <div className={"liquidity-info" + (this.state.optionsLiquidity === 0 ? " no-liquidity" : "")} >
            Liquidity Available: {this.getTotalLiquidityFormatted()}
          </div>
          <div className="action-button-wrapper">
            {this.getButtonMessage() === null ?
              (this.isConnected() ? 
                <div className="action-btn medium solid-blue" onClick={this.onCreateClick}>
                  <div>CREATE OPTION</div>
                </div> :
                <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
                  <div>CONNECT WALLET</div>
                </div>)
              :
              <div className="action-btn medium solid-blue disabled">
                <div>{this.getButtonMessage()}</div>
              </div>}
          </div>
        </div>
        {this.state.createOption && <CreateOptionModal optionData={this.getOptionData()} onHide={this.onCreateOptionHide} />}
      </div>
  }
}

CreateOption.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(CreateOption)