import './UpdateSellingOptionsModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { fromDecimals, StrikePriceModes, StrikePriceOptions, STRIKE_PRICE_MODE, STRIKE_PRICE_OPTIONS, toDecimals } from '../../util/constants'
import { checkTransactionIsMined } from '../../util/web3Methods'
import StepsModal from '../StepsModal/StepsModal'
import DecimalInput from '../Util/DecimalInput'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { refreshAcoPermissionConfig, setAcoPermissionConfig } from '../../util/acoPoolMethodsv5'
import SimpleDropdown from '../SimpleDropdown'

class UpdateSellingOptionsModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tolerancePriceBelowMin: "",
      tolerancePriceBelowMax: "",
      tolerancePriceAboveMin: "",
      tolerancePriceAboveMax: "",
      minStrikePrice: "",
      maxStrikePrice: "",
      minExpiration: "",
      maxExpiration: "",
      priceSettingsType: "",
      priceMode: "",
    }
  }

  componentDidMount = () => {
    let pool = this.props.pool
    let priceSettingsType = STRIKE_PRICE_OPTIONS[0]
    let priceMode = null
    if (this.props.tolerancePriceAboveMin === null && this.props.tolerancePriceBelowMin === null && 
      this.props.tolerancePriceAboveMax === null && this.props.tolerancePriceBelowMax === null && this.props.minStrikePrice === null && this.props.maxStrikePrice === null) {
        priceMode = STRIKE_PRICE_MODE[3]
    }
    else if (this.props.tolerancePriceAboveMin === null && this.props.tolerancePriceBelowMin === null && 
      this.props.tolerancePriceAboveMax === null && this.props.tolerancePriceBelowMax === null && 
      (this.props.minStrikePrice !== null || this.props.maxStrikePrice !== null)) {
        priceMode = STRIKE_PRICE_MODE[0]
    }
    else if (this.props.tolerancePriceAboveMin !== null || this.props.tolerancePriceBelowMin !== null || 
      this.props.tolerancePriceAboveMax !== null || this.props.tolerancePriceBelowMax !== null) {
      if (this.props.minStrikePrice === null && this.props.maxStrikePrice === null) {
        priceMode = STRIKE_PRICE_MODE[1]
      }
      else {
        priceMode = STRIKE_PRICE_MODE[2]
      }

      if (this.props.tolerancePriceBelowMin === null && this.props.tolerancePriceBelowMax === null) {
        priceSettingsType = pool.isCall ? STRIKE_PRICE_OPTIONS[0] : STRIKE_PRICE_OPTIONS[1]
      }
      else if (this.props.tolerancePriceAboveMin === null && this.props.tolerancePriceAboveMax === null) {
        priceSettingsType = pool.isCall ? STRIKE_PRICE_OPTIONS[1] : STRIKE_PRICE_OPTIONS[0]
      }
      else {
        priceSettingsType = STRIKE_PRICE_OPTIONS[2]
      }
    }

    this.setState({
      tolerancePriceBelowMin: this.getTolerance(this.props.tolerancePriceBelowMin),
      tolerancePriceBelowMax: this.getTolerance(this.props.tolerancePriceBelowMax),
      tolerancePriceAboveMin: this.getTolerance(this.props.tolerancePriceAboveMin),
      tolerancePriceAboveMax: this.getTolerance(this.props.tolerancePriceAboveMax),
      minStrikePrice: fromDecimals(this.props.minStrikePrice, 6, 6, 0),
      maxStrikePrice: fromDecimals(this.props.maxStrikePrice, 6, 6, 0),
      noFixedMin: this.props.minStrikePrice === null,
      noFixedMax: this.props.maxStrikePrice === null,
      minExpiration: this.props.minExpiration,
      maxExpiration: this.props.maxExpiration,
      noMax: this.props.tolerancePriceAboveMax === null,
      priceMode: priceMode,
      priceSettingsType: priceSettingsType
    })
  }

  getTolerance = (value) => {
    if (value !== null) {
      return value * 100
    }
    return ""
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  getToleranceDecimals = (stateValue) => {
    if (stateValue === null || isNaN(stateValue) || stateValue < 0) {
      return "-1"
    }
    else {
      return toDecimals(stateValue / 100.0, 5).toString()
    }
  }

  getStrikePriceDecimals = (stateValue) => {
    if (stateValue === null || isNaN(stateValue) || stateValue < 0) {
      return "-1"
    }
    else {
      return toDecimals(stateValue, 6).toString()
    }
  }

  onConfirmClick = () => {
    if (this.canConfirm()) {
      var stepNumber = 0
      let pool = this.props.pool
      let tolerancePriceBelowMin = this.getToleranceDecimals(this.state.tolerancePriceBelowMin)
      let tolerancePriceBelowMax = this.getToleranceDecimals(this.state.tolerancePriceBelowMax)
      let tolerancePriceAboveMin = this.getToleranceDecimals(this.state.tolerancePriceAboveMin)
      let tolerancePriceAboveMax = this.getToleranceDecimals(this.state.tolerancePriceAboveMax)
      let minStrikePrice = this.getStrikePriceDecimals(this.state.minStrikePrice)
      let maxStrikePrice = this.getStrikePriceDecimals(this.state.maxStrikePrice)
      if (this.state.priceMode.value === StrikePriceModes.AnyPrice || this.state.priceMode.value === StrikePriceModes.Fixed) {
        tolerancePriceBelowMin = "-1"
        tolerancePriceBelowMax = "-1"
        tolerancePriceAboveMin = "-1"
        tolerancePriceAboveMax = "-1"
      }
      if (this.state.priceMode.value === StrikePriceModes.AnyPrice || this.state.priceMode.value === StrikePriceModes.Percentage) {
        minStrikePrice = 0
        maxStrikePrice = 0
      }
      if (this.state.priceMode.value === StrikePriceModes.Fixed) {
        if (this.state.noFixedMin) {
          minStrikePrice = 0        
        }
        if (this.state.noFixedMax) {
          maxStrikePrice = 0
        }
      }

      if (this.state.priceMode.value === StrikePriceModes.Percentage || this.state.priceMode.value === StrikePriceModes.Both) {
        if ((this.state.priceSettingsType.value === StrikePriceOptions.OTM && pool.isCall) || 
          (this.state.priceSettingsType.value === StrikePriceOptions.ITM && !pool.isCall)) {
          tolerancePriceBelowMin = "-1"
          tolerancePriceBelowMax = "-1"
          if (this.state.noMax) {
            tolerancePriceAboveMax = "-1"
          }
        }
        else if ((this.state.priceSettingsType.value === StrikePriceOptions.OTM && !pool.isCall) || 
          (this.state.priceSettingsType.value === StrikePriceOptions.ITM && pool.isCall)) {
            tolerancePriceAboveMin = "-1"
            tolerancePriceAboveMax = "-1"
        }
        else if (this.state.priceSettingsType.value === StrikePriceOptions.ATM) {
          tolerancePriceBelowMin = "-1"
          tolerancePriceAboveMin = "-1"
        }
      }

      let minExpiration = this.state.minExpiration * 86400
      let maxExpiration = this.state.maxExpiration * 86400
      this.setStepsModalInfo(++stepNumber)
      setAcoPermissionConfig(this.context.web3.selectedAccount, pool.address, tolerancePriceBelowMin, tolerancePriceBelowMax, tolerancePriceAboveMin, tolerancePriceAboveMax, minStrikePrice, maxStrikePrice, minExpiration, maxExpiration)
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
    var title = "Update Selling Options"
    var subtitle = ""
    var img = null
    if (stepNumber === 1) {
      subtitle = "Confirm on " + this.context.web3.name + " to send update transaction."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 2) {
      subtitle = "Updating selling options..."
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
    }, () => refreshAcoPermissionConfig(this.props.pool.address))
  }

  onDoneButtonClick = () => {
    this.setState({ stepsModalInfo: null })
    this.props.onHide(true)
  }

  onHideStepsModal = () => {
    this.setState({ stepsModalInfo: null })
  }

  getButtonMessage = () => {
    var isCall = this.props.pool.isCall
    if (this.state.minExpiration === null || this.state.minExpiration === "" || this.state.minExpiration < 0) {
      return "Enter minimum expiration"
    }
    if (this.state.maxExpiration === null || this.state.maxExpiration === "" || this.state.maxExpiration < 0) {
      return "Enter maximum expiration"
    }
    if (this.state.priceMode === null || this.state.priceMode === "") {
      return "Select strike price range"
    }
    if (this.state.priceMode.value === StrikePriceModes.Fixed || this.state.priceMode.value === StrikePriceModes.Both) {
      if (!this.state.noFixedMin && (this.state.minStrikePrice === null || this.state.minStrikePrice === "")) {
        return "Select min strike price"
      }
      if (!this.state.noFixedMax && (this.state.maxStrikePrice === null || this.state.maxStrikePrice === "")) {
        return "Select max strike price"
      }
      if ((this.state.minStrikePrice !== null && this.state.minStrikePrice !== "") && 
        (this.state.maxStrikePrice !== null && this.state.maxStrikePrice !== "")) {
        if (Number(this.state.minStrikePrice) > Number(this.state.maxStrikePrice)) {
          return "Invalid fixed range"
        }
      }
    }
    if (this.state.priceMode.value === StrikePriceModes.Percentage || this.state.priceMode.value === StrikePriceModes.Both) {
      if ((this.state.tolerancePriceBelowMin === null || this.state.tolerancePriceBelowMin === "") && 
        ((this.state.priceSettingsType.value === StrikePriceOptions.OTM && !isCall) || 
          (this.state.priceSettingsType.value === StrikePriceOptions.ITM && isCall))) {
        return "Set percentage range"
      }
      if ((this.state.tolerancePriceBelowMax === null || this.state.tolerancePriceBelowMax === "") && 
        ((this.state.priceSettingsType.value === StrikePriceOptions.OTM && !isCall) || 
          (this.state.priceSettingsType.value === StrikePriceOptions.ITM && isCall) || 
          this.state.priceSettingsType.value === StrikePriceOptions.ATM)) {
        return "Set percentage range"
      }
      if ((this.state.tolerancePriceAboveMin === null || this.state.tolerancePriceAboveMin === "") && 
        ((this.state.priceSettingsType.value === StrikePriceOptions.ITM && !isCall) || 
          (this.state.priceSettingsType.value === StrikePriceOptions.OTM && isCall))) {
        return "Set percentage range"
      }
      if ((this.state.tolerancePriceAboveMax === null || this.state.tolerancePriceAboveMax === "") && 
        ((this.state.priceSettingsType.value === StrikePriceOptions.ATM) ||
        (((this.state.priceSettingsType.value === StrikePriceOptions.ITM && !isCall) || 
          (this.state.priceSettingsType.value === StrikePriceOptions.OTM && isCall)) && 
          !this.state.noMax))) {
        return "Set percentage range"
      }
    }
    if (this.state.tolerancePriceBelowMin !== null && this.state.tolerancePriceBelowMin !== "" && 
      this.state.tolerancePriceBelowMax !== null && this.state.tolerancePriceBelowMax !== "" && 
      Number(this.state.tolerancePriceBelowMin) > Number(this.state.tolerancePriceBelowMax)) {
      return "Invalid percentage range"
    }
    if (this.state.tolerancePriceAboveMin !== null && this.state.tolerancePriceAboveMin !== "" && 
      this.state.tolerancePriceAboveMax !== null && this.state.tolerancePriceAboveMax !== "" && 
      Number(this.state.tolerancePriceAboveMin) > Number(this.state.tolerancePriceAboveMax)) {
        return "Invalid percentage range"
    }
    if (this.state.ivValue === null || this.state.ivValue === "") {
        return "Set implied volatility"
    }
    return null
  }

  canConfirm = () => {
    return (this.getButtonMessage() === null)
  }

  onMinExpirationChange = (value) => {
    this.setState({ minExpiration: value })
  }

  onMaxExpirationChange = (value) => {
    this.setState({ maxExpiration: value })
  }

  onTolerancePriceAboveMinChange = (value) => {
    this.setState({ tolerancePriceAboveMin: value })
  }

  onTolerancePriceAboveMaxChange = (value) => {
    this.setState({ tolerancePriceAboveMax: value })
  }

  onTolerancePriceBelowMinChange = (value) => {
    this.setState({ tolerancePriceBelowMin: value })
  }

  onTolerancePriceBelowMaxChange = (value) => {
    this.setState({ tolerancePriceBelowMax: value })
  }

  priceSettingsTypeChange = (option) => {
    this.setState({priceSettingsType: option})
  }

  priceModeChange = (option) => {
    this.setState({ priceMode: option });
  }

  onNoMaxChange = (event) => {
    this.setState({noMax: event.target.checked, tolerancePriceAboveMax: ""})
  }
  
  onNoFixedMinChange = (event) => {
    this.setState({ noFixedMin: event.target.checked, minStrikePrice: "" });
  }

  onNoFixedMaxChange = (event) => {
    this.setState({ noFixedMax: event.target.checked, maxStrikePrice: "" });
  }  

  onMaxStrikePriceChange = (value) => {
    this.setState({ maxStrikePrice: value });
  }

  onMinStrikePriceChange = (value) => {
    this.setState({ minStrikePrice: value });
  }

  render() {
    let isCall = this.props.pool.isCall
    return (<Modal className="aco-modal update-selling-options-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Header closeButton>UPDATE SELLING OPTIONS</Modal.Header>
      <Modal.Body>
        <div className="exercise-action">
          <div className="confirm-card">
            <div className="confirm-card-body">
            <div className="expiration-and-price-info">
                <div className="card-separator"></div>
                <div className="section-label">Expiration Range</div>
                <div className="input-row">
                  <div className="label-input-row">
                    <div>Current Date +&nbsp;</div>
                    <div className="input-field input-field-sm">
                      <DecimalInput decimals={0} onChange={this.onMinExpirationChange} value={this.state.minExpiration}></DecimalInput>
                      <div className="coin-symbol">days</div>
                    </div>
                  </div>
                  <div>&lt;</div>
                  <div>Expiration Date</div>
                  <div>&lt;</div>
                  <div className="label-input-row">
                    <div>Current Date +&nbsp;</div>
                    <div className="input-field input-field-sm">
                      <DecimalInput decimals={0} onChange={this.onMaxExpirationChange} value={this.state.maxExpiration}></DecimalInput>
                      <div className="coin-symbol">days</div>
                    </div>
                  </div>
                </div>
                <div className="card-separator"></div>
                <div className="section-label">Strike Price Range</div>
                <div className="input-row justify-content-center">
                  <div className="input-column">
                    <div className="input-field">
                      <SimpleDropdown selectedOption={this.state.priceMode} options={STRIKE_PRICE_MODE} onSelectOption={this.priceModeChange}></SimpleDropdown>
                    </div>
                  </div>
                </div>
                {this.state.priceMode &&
                  (this.state.priceMode.value === StrikePriceModes.Fixed || 
                    this.state.priceMode.value === StrikePriceModes.Both) && <>
                    <div className="subsection-label">Fixed</div>
                    <div className="subsection-label-2">Set min and max strike price</div>
                    <div className="input-row mt-2 no-max-input-row fixed-strike-row">
                      <div className={"label-input-column no-max-input " + (this.state.noFixedMin ? "no-max-checked" : "")}>
                        <div className="form-group form-check">
                          <input type="checkbox" onChange={this.onNoFixedMinChange} checked={this.state.noFixedMin} className="form-check-input clickable" id="noFixedMinCheck" />
                          <label className="form-check-label clickable" htmlFor="noFixedMinCheck">No min</label>
                        </div>
                        <div className="label-input-row">
                          <div className="input-field">
                            <DecimalInput disabled={this.state.noFixedMin} onChange={this.onMinStrikePriceChange} value={this.state.minStrikePrice}></DecimalInput>
                            <div className="coin-symbol">USDC</div>
                          </div>
                        </div>
                      </div>
                      <div className={this.state.noFixedMin ? "no-max-checked" : ""}>
                        &lt;=
                      </div>
                      <div>Strike Price</div>
                      <div className={this.state.noFixedMax ? "no-max-checked" : ""}>
                        &lt;=
                      </div>
                      <div className={"label-input-column no-max-input " + (this.state.noFixedMax ? "no-max-checked" : "")}>
                        <div className="form-group form-check">
                          <input type="checkbox" onChange={this.onNoFixedMaxChange} checked={this.state.noFixedMax} className="form-check-input clickable" id="noFixedMaxCheck"/>
                          <label className="form-check-label clickable" htmlFor="noFixedMaxCheck">No max</label>
                        </div>
                        <div className="label-input-row">
                          <div className="input-field ">
                            <DecimalInput disabled={this.state.noFixedMax} onChange={this.onMaxStrikePriceChange} value={this.state.maxStrikePrice}></DecimalInput>
                            <div className="coin-symbol">USDC</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>}
                {(this.state.priceMode.value === StrikePriceModes.Percentage || 
                    this.state.priceMode.value === StrikePriceModes.Both) && (
                  <>
                    <div className="subsection-label">Percentage</div>
                    <div className="subsection-label-2">Percentage deviation from oracle price</div>
                    <div className="input-row justify-content-center">
                      <div className="input-column">
                        <div className="input-field">
                          <SimpleDropdown placeholder="OTM, ITM or ATM" selectedOption={this.state.priceSettingsType} options={STRIKE_PRICE_OPTIONS} onSelectOption={this.priceSettingsTypeChange}></SimpleDropdown>
                        </div>
                      </div>
                    </div>
                    {this.state.priceSettingsType && (
                      <>
                        {((this.state.priceSettingsType.value === StrikePriceOptions.OTM &&
                          isCall) ||
                          (this.state.priceSettingsType.value === StrikePriceOptions.ITM &&
                            !isCall)) && (
                          <div className="input-row mt-2 no-max-input-row">
                            <div className="label-input-row">
                              <div>Oracle Price +&nbsp;</div>
                              <div className="input-field input-field-sm">
                                <DecimalInput
                                  onChange={this.onTolerancePriceAboveMinChange}
                                  value={this.state.tolerancePriceAboveMin}
                                ></DecimalInput>
                                <div className="coin-symbol">%</div>
                              </div>
                            </div>
                            <div>&lt;=</div>
                            <div>Strike Price</div>
                            <div
                              className={
                                this.state.noMax ? "no-max-checked" : ""
                              }
                            >
                              &lt;=
                            </div>
                            <div
                              className={
                                "label-input-column no-max-input " +
                                (this.state.noMax ? "no-max-checked" : "")
                              }
                            >
                              <div className="form-group form-check">
                                <input
                                  type="checkbox"
                                  onChange={this.onNoMaxChange}
                                  checked={this.state.noMax}
                                  className="form-check-input clickable"
                                  id="noMaxCheck"
                                />
                                <label
                                  className="form-check-label clickable"
                                  htmlFor="noMaxCheck"
                                >
                                  No max
                                </label>
                              </div>
                              <div className="label-input-row">
                                <div>Oracle Price +&nbsp;</div>
                                <div className="input-field input-field-sm">
                                  <DecimalInput
                                    disabled={this.state.noMax}
                                    onChange={
                                      this.onTolerancePriceAboveMaxChange
                                    }
                                    value={this.state.tolerancePriceAboveMax}
                                  ></DecimalInput>
                                  <div className="coin-symbol">%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {((this.state.priceSettingsType.value === StrikePriceOptions.OTM &&
                          !isCall) ||
                          (this.state.priceSettingsType.value === StrikePriceOptions.ITM &&
                            isCall)) && (
                          <div className="input-row mt-2">
                            <div className="label-input-row">
                              <div>Oracle Price -&nbsp;</div>
                              <div className="input-field input-field-sm">
                                <DecimalInput
                                  onChange={this.onTolerancePriceBelowMaxChange}
                                  value={this.state.tolerancePriceBelowMax}
                                ></DecimalInput>
                                <div className="coin-symbol">%</div>
                              </div>
                            </div>
                            <div>&lt;=</div>
                            <div>Strike Price</div>
                            <div>&lt;=</div>
                            <div className="label-input-row">
                              <div>Oracle Price -&nbsp;</div>
                              <div className="input-field input-field-sm">
                                <DecimalInput
                                  onChange={this.onTolerancePriceBelowMinChange}
                                  value={this.state.tolerancePriceBelowMin}
                                ></DecimalInput>
                                <div className="coin-symbol">%</div>
                              </div>
                            </div>
                          </div>
                        )}
                        {this.state.priceSettingsType.value === StrikePriceOptions.ATM && (
                          <div className="input-row mt-2">
                            <div className="label-input-row">
                              <div>Oracle Price -&nbsp;</div>
                              <div className="input-field input-field-sm">
                                <DecimalInput
                                  onChange={this.onTolerancePriceBelowMaxChange}
                                  value={this.state.tolerancePriceBelowMax}
                                ></DecimalInput>
                                <div className="coin-symbol">%</div>
                              </div>
                            </div>
                            <div>&lt;=</div>
                            <div>Strike Price</div>
                            <div>&lt;=</div>
                            <div className="label-input-row">
                              <div>Oracle Price +&nbsp;</div>
                              <div className="input-field input-field-sm">
                                <DecimalInput
                                  onChange={this.onTolerancePriceAboveMaxChange}
                                  value={this.state.tolerancePriceAboveMax}
                                ></DecimalInput>
                                <div className="coin-symbol">%</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="confirm-card-actions">
              <div className="aco-button cancel-btn" onClick={() => this.props.onHide(false)}>Go back</div>
              <div className={"aco-button action-btn " + (this.canConfirm() ? "" : "disabled")} title={this.getButtonMessage()} onClick={this.onConfirmClick}>Confirm</div>
            </div>
          </div>
          {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
        </div>
      </Modal.Body>
    </Modal>)
  }
}

UpdateSellingOptionsModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(UpdateSellingOptionsModal)