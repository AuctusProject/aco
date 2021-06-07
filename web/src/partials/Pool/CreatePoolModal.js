import "./CreatePoolModal.css";
import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import OptionBadge from "../OptionBadge";
import SimpleAssetDropdown from "../SimpleAssetDropdown";
import DecimalInput from "../Util/DecimalInput";
import { STRIKE_PRICE_MODE, STRIKE_PRICE_OPTIONS } from "../../util/constants";
import SimpleDropdown from "../SimpleDropdown";

export const CREATE_POOL_UNDERLYING_OPTIONS = [
  {
    value: "ETH",
    name: "ETH",
    icon: "/images/eth_icon.png",
  },
  {
    value: "WBTC",
    name: "WBTC",
    icon: "/images/wbtc_icon.png",
  },
];

class CreatePoolModal extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitialState(props);
  }

  getInitialState = (props) => {
    var state = {
      selectedType: 1,
      selectedUnderlying: CREATE_POOL_UNDERLYING_OPTIONS[0],
      priceMode: STRIKE_PRICE_MODE[0],
      priceSettingsType: STRIKE_PRICE_OPTIONS[0],
      maxStrikePrice: "",
      minStrikePrice: "",
      tolerancePriceBelowMin: "",
      tolerancePriceBelowMax: "",
      tolerancePriceAboveMin: "",
      tolerancePriceAboveMax: "",
      minExpiration: "",
      maxExpiration: "",
      ivValue: ""
    };
    return state;
  }

  componentDidMount = () => {}

  selectType = (type) => {
    this.setState({ selectedType: type });
  }

  getButtonMessage = () => {
    if (!this.state.selectedUnderlying) {
      return "Select underlying";
    }
    return null;
  }

  canProceed = () => {
    return this.getButtonMessage() === null;
  }

  onAssetSelected = (selectedAsset) => {
    this.setState({ selectedUnderlying: selectedAsset });
  }

  isConnected = () => {
    return (
      this.context &&
      this.context.web3 &&
      this.context.web3.selectedAccount &&
      this.context.web3.validNetwork
    );
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context);
  }

  onCreateClick = () => {}

  onIVValueChange = (value) => {
    this.setState({ ivValue: value });
  }

  onHideStepsModal = () => {
    this.setState({ stepsModalInfo: null });
  }

  onMinExpirationChange = (value) => {
    this.setState({ minExpiration: value });
  }

  onMaxExpirationChange = (value) => {
    this.setState({ maxExpiration: value });
  }

  onTolerancePriceAboveMinChange = (value) => {
    this.setState({ tolerancePriceAboveMin: value });
  }

  onTolerancePriceAboveMaxChange = (value) => {
    this.setState({ tolerancePriceAboveMax: value });
  }

  onTolerancePriceBelowMinChange = (value) => {
    this.setState({ tolerancePriceBelowMin: value });
  }

  onTolerancePriceBelowMaxChange = (value) => {
    this.setState({ tolerancePriceBelowMax: value });
  }

  priceSettingsTypeChange = (option) => {
    this.setState({ priceSettingsType: option });
  }

  priceModeChange = (option) => {
    this.setState({ priceMode: option });
  }

  onNoMaxChange = (event) => {
    this.setState({ noMax: event.target.checked, tolerancePriceAboveMax: "" });
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

  onConfirmClick = () => {
    if (this.canConfirm()) {
      var stepNumber = 0
      let pool = this.props.pool
      let tolerancePriceBelowMin = this.getToleranceDecimals(this.state.tolerancePriceBelowMin)
      let tolerancePriceBelowMax = this.getToleranceDecimals(this.state.tolerancePriceBelowMax)
      let tolerancePriceAboveMin = this.getToleranceDecimals(this.state.tolerancePriceAboveMin)
      let tolerancePriceAboveMax = this.getToleranceDecimals(this.state.tolerancePriceAboveMax)
      if (this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[0]) {
        tolerancePriceBelowMin = "-1"
        tolerancePriceBelowMax = "-1"
        tolerancePriceAboveMin = "-1"
        tolerancePriceAboveMax = "-1"
      }
      else if ((this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[1] && pool.isCall) || 
        (this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[2] && !pool.isCall)) {
        tolerancePriceBelowMin = "-1"
        tolerancePriceBelowMax = "-1"
        if (this.state.noMax) {
          tolerancePriceAboveMax = "-1"
        }
      }
      else if ((this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[1] && !pool.isCall) || 
        (this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[2] && pool.isCall)) {
          tolerancePriceAboveMin = "-1"
          tolerancePriceAboveMax = "-1"
      }
      else if (this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[3]) {
        tolerancePriceBelowMin = "-1"
        tolerancePriceAboveMin = "-1"
      }

      let minExpiration = this.state.minExpiration * 86400
      let maxExpiration = this.state.maxExpiration * 86400
      this.setStepsModalInfo(++stepNumber)
      //TODO MIN and MAX strike price (zero is same that undefined)
      // setAcoPermissionConfig(this.context.web3.selectedAccount, pool.address, tolerancePriceBelowMin, tolerancePriceBelowMax, tolerancePriceAboveMin, tolerancePriceAboveMax, "0", "0", minExpiration, maxExpiration)
      //   .then(result => {
      //     if (result) {
      //       this.setStepsModalInfo(++stepNumber)
      //       checkTransactionIsMined(result)
      //         .then(result => {
      //           if (result) {
      //             this.setStepsModalInfo(++stepNumber)
      //           }
      //           else {
      //             this.setStepsModalInfo(-1)
      //           }
      //         })
      //         .catch(() => {
      //           this.setStepsModalInfo(-1)
      //         })
      //     }
      //     else {
      //       this.setStepsModalInfo(-1)
      //     }
      //   })
      //   .catch(() => {
      //     this.setStepsModalInfo(-1)
      //   })
    }
  }

  getButtonMessage = () => {
    var isCall = this.state.selectedType === 1
    if (this.state.minExpiration === null || this.state.minExpiration === "" || this.state.minExpiration < 0) {
      return "Enter minimum expiration"
    }
    if (this.state.maxExpiration === null || this.state.maxExpiration === "" || this.state.maxExpiration < 0) {
      return "Enter maximum expiration"
    }
    if (this.state.priceMode === null || this.state.priceMode === "") {
      return "Select strike price range"
    }
    if ((this.state.tolerancePriceBelowMin === null || this.state.tolerancePriceBelowMin === "") && 
      ((this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[1] && !isCall) || 
        (this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[2] && isCall))) {
      return "Set deviation"
    }
    if ((this.state.tolerancePriceBelowMax === null || this.state.tolerancePriceBelowMax === "") && 
      ((this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[1] && !isCall) || 
        (this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[2] && isCall) || 
        this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[3])) {
      return "Set deviation"
    }
    if ((this.state.tolerancePriceAboveMin === null || this.state.tolerancePriceAboveMin === "") && 
      ((this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[2] && !isCall) || 
        (this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[1] && isCall))) {
      return "Set deviation"
    }
    if ((this.state.tolerancePriceAboveMax === null || this.state.tolerancePriceAboveMax === "") && 
      ((this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[3]) ||
      (((this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[2] && !isCall) || 
        (this.state.priceSettingsType === STRIKE_PRICE_OPTIONS[1] && isCall)) && 
        !this.state.noMax))) {
      return "Set deviation"
    }
    if (this.state.tolerancePriceBelowMin !== null && this.state.tolerancePriceBelowMin !== "" && 
      this.state.tolerancePriceBelowMax !== null && this.state.tolerancePriceBelowMax !== "" && 
      Number(this.state.tolerancePriceBelowMin) > Number(this.state.tolerancePriceBelowMax)) {
      return "Invalid interval"
    }
    if (this.state.tolerancePriceAboveMin !== null && this.state.tolerancePriceAboveMin !== "" && 
      this.state.tolerancePriceAboveMax !== null && this.state.tolerancePriceAboveMax !== "" && 
      Number(this.state.tolerancePriceAboveMin) > Number(this.state.tolerancePriceAboveMax)) {
      return "Invalid interval"
    }
    return null
  }

  render() {
    return (
      <Modal className="aco-modal create-pool-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
        <Modal.Header closeButton>CREATE POOL</Modal.Header>
        <Modal.Body>
          <div className="py-3">
            <div className="page-title">
              Options to be written
            </div>
            <div className="page-subtitle">
              Set the type and parameters of the options to be written
            </div>
            <div className="create-pool-content">
              <div className="inputs-wrapper-row">
                <div className="input-column underlying-column">
                  <div className="input-label">Underlying</div>
                  <div className="input-field">
                    <SimpleAssetDropdown placeholder="Select underlying" selectedOption={this.state.selectedUnderlying} options={CREATE_POOL_UNDERLYING_OPTIONS} onSelectOption={this.onAssetSelected} />
                  </div>
                </div>
                <div className="input-column">
                  <div className="input-label">Type</div>
                  <div className="input-field type-toggle">
                    <OptionBadge onClick={() => this.selectType(1)} className={this.state.selectedType === 1 ? "active" : "unselected"} isCall={true} />
                    <OptionBadge onClick={() => this.selectType(2)} className={this.state.selectedType === 2 ? "active" : "unselected"} isCall={false} />
                  </div>
                </div>
              </div>
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
                  (this.state.priceMode === STRIKE_PRICE_MODE[0] || 
                    this.state.priceMode === STRIKE_PRICE_MODE[2]) && <>
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
                {(this.state.priceMode === STRIKE_PRICE_MODE[1] || 
                    this.state.priceMode === STRIKE_PRICE_MODE[2]) && (
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
                        {((this.state.priceSettingsType.value === 2 &&
                          this.state.selectedType === 1) ||
                          (this.state.priceSettingsType.value === 3 &&
                            this.state.selectedType !== 1)) && (
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
                        {((this.state.priceSettingsType.value === 2 &&
                          this.state.selectedType !== 1) ||
                          (this.state.priceSettingsType.value === 3 &&
                            this.state.selectedType === 1)) && (
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
                        {this.state.priceSettingsType.value === 4 && (
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
                <div className="card-separator"></div>
                <div className="section-label">Option Pricing</div>
                <div className="input-row justify-content-center">
                  <div className="input-column">
                    <div className="input-label">Implied Volatility</div>
                    <div className="input-field">
                      <DecimalInput
                        tabIndex="-1"
                        onChange={this.onIVValueChange}
                        value={this.state.ivValue}
                      ></DecimalInput>
                      <div className="coin-symbol">%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-button-wrapper">
                {this.getButtonMessage() === null ? (
                  this.isConnected() ? (
                    <div
                      className="action-btn medium solid-blue"
                      onClick={this.onCreateClick}
                    >
                      <div>CREATE POOL</div>
                    </div>
                  ) : (
                    <div
                      className="action-btn medium solid-blue"
                      onClick={this.onConnectClick}
                    >
                      <div>CONNECT WALLET</div>
                    </div>
                  )
                ) : (
                  <div className="action-btn medium solid-blue disabled">
                    <div>{this.getButtonMessage()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}

CreatePoolModal.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object,
};
export default withRouter(CreatePoolModal);
