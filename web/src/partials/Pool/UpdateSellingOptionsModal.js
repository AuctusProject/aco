import './UpdateSellingOptionsModal.css'
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
import { setAcoPermissionConfig } from '../../util/acoPoolMethodsv4'
import SimpleDropdown from '../SimpleDropdown'

const strikePriceOptions = [
  {value: 1, name:"ANY PRICE"}, 
  {value: 2, name:"OTM"}, 
  {value: 3, name:"ITM"}, 
  {value: 4, name:"ATM"}
]

class UpdateSellingOptionsModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tolerancePriceBelow: "",
      tolerancePriceAbove: "",
      minExpiration: "",
      maxExpiration: "",
      priceSettingsType: ""
    }
  }

  componentDidMount = () => {
    let pool = this.props.pool
    let priceSettingsType = null
    if (this.props.tolerancePriceAbove === 0 && this.props.tolerancePriceBelow === 0) {
      priceSettingsType = strikePriceOptions[0]
    }
    else if (this.props.tolerancePriceBelow === 0) {
      priceSettingsType = pool.isCall ? strikePriceOptions[1] : strikePriceOptions[2]
    }
    else if (this.props.tolerancePriceAbove === 0) {
      priceSettingsType = pool.isCall ? strikePriceOptions[2] : strikePriceOptions[1]
    }
    else {
      priceSettingsType = strikePriceOptions[3]
    }

    this.setState({
      tolerancePriceBelow: this.props.tolerancePriceBelow * 100,
      tolerancePriceAbove: this.props.tolerancePriceAbove * 100,
      minExpiration: this.props.minExpiration,
      maxExpiration: this.props.maxExpiration,
      priceSettingsType: priceSettingsType
    })
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  onConfirmClick = () => {
    if (this.canConfirm()) {
      var stepNumber = 0
      let pool = this.props.pool
      let tolerancePriceBelow = toDecimals(this.state.tolerancePriceBelow / 100.0, 5)
      let tolerancePriceAbove = toDecimals(this.state.tolerancePriceAbove / 100.0, 5)
      if (this.state.priceSettingsType === strikePriceOptions[0]) {
        tolerancePriceBelow = 0
        tolerancePriceAbove = 0
      }
      else if ((this.state.priceSettingsType === strikePriceOptions[1] && pool.isCall) || 
        (this.state.priceSettingsType === strikePriceOptions[2] && !pool.isCall)) {
        tolerancePriceBelow = 0
      }
      else if ((this.state.priceSettingsType === strikePriceOptions[1] && !pool.isCall) || 
        (this.state.priceSettingsType === strikePriceOptions[2] && pool.isCall)) {
          tolerancePriceAbove = 0
      }

      let minExpiration = this.state.minExpiration * 86400
      let maxExpiration = this.state.maxExpiration * 86400
      this.setStepsModalInfo(++stepNumber)
      setAcoPermissionConfig(this.context.web3.selectedAccount, pool.address, 0, tolerancePriceBelow, 0, tolerancePriceAbove, minExpiration, maxExpiration)
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
      subtitle = "Confirm on Metamask to send update transaction."
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
    let pool = this.props.pool
    if (this.state.minExpiration === null || this.state.minExpiration === "" || this.state.minExpiration < 0) {
      return "Enter minimum expiration"
    }
    if (this.state.maxExpiration === null || this.state.maxExpiration === "" || this.state.maxExpiration < 0) {
      return "Enter maximum expiration"
    }
    if (this.state.priceSettingsType === null || this.state.priceSettingsType === "") {
      return "Select strike price option"
    }
    if ((this.state.tolerancePriceBelow === null || this.state.tolerancePriceBelow === "" || this.state.tolerancePriceBelow <= 0) && 
      ((this.state.priceSettingsType === strikePriceOptions[3]) ||
      (this.state.priceSettingsType === strikePriceOptions[1] && !pool.isCall) || 
        (this.state.priceSettingsType === strikePriceOptions[2] && pool.isCall))) {
      return "Enter tolerance price below"
    }
    if ((this.state.tolerancePriceAbove === null || this.state.tolerancePriceAbove === "" || this.state.tolerancePriceAbove <= 0) && 
      ((this.state.priceSettingsType === strikePriceOptions[3]) ||
      (this.state.priceSettingsType === strikePriceOptions[2] && !pool.isCall) || 
        (this.state.priceSettingsType === strikePriceOptions[1] && pool.isCall))) {
      return "Enter tolerance price above"
    }
    return null
  }

  canConfirm = () => {
    return (this.getButtonMessage() === null)
  }

  onValueChange = (value) => {
    this.setState({ value: value })
  }

  onMinExpirationChange = (value) => {
    this.setState({ minExpiration: value })
  }

  onMaxExpirationChange = (value) => {
    this.setState({ maxExpiration: value })
  }

  onTolerancePriceAboveChange = (value) => {
    this.setState({ tolerancePriceAbove: value })
  }

  onTolerancePriceBelowChange = (value) => {
    this.setState({ tolerancePriceBelow: value })
  }

  priceSettingsTypeChange = (option) => {
    this.setState({priceSettingsType: option})
  }

  render() {
    let pool = this.props.pool
    return (<Modal className="aco-modal update-selling-options-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Header closeButton>UPDATE SELLING OPTIONS</Modal.Header>
      <Modal.Body>
        <div className="exercise-action">
          <div className="confirm-card">
            <div className="confirm-card-body">
              <div className="input-label">Expiration Date Options</div>
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
              <div className="input-row">
                <div className="input-column">
                  <div className="input-label">Strike Price Options</div>
                  <div className="input-field">
                    <SimpleDropdown placeholder="Strike Settings" selectedOption={this.state.priceSettingsType} options={strikePriceOptions} onSelectOption={this.priceSettingsTypeChange}></SimpleDropdown>
                  </div>
                </div>
              </div>
              {this.state.priceSettingsType && <>
                {((this.state.priceSettingsType.value === 2 && pool.isCall) || 
                  (this.state.priceSettingsType.value === 3 && !pool.isCall)) &&
                <div className="input-row mt-2">
                  <div>Strike Price</div>
                  <div>&gt;</div>
                  <div className="label-input-row">
                    <div>Current Price +&nbsp;</div>
                    <div className="input-field input-field-sm">
                      <DecimalInput onChange={this.onTolerancePriceAboveChange} value={this.state.tolerancePriceAbove}></DecimalInput>
                      <div className="coin-symbol">%</div>
                    </div>
                  </div>
                </div>}
                {((this.state.priceSettingsType.value === 2 && !pool.isCall) || 
                  (this.state.priceSettingsType.value === 3 && pool.isCall)) &&
                <div className="input-row mt-2">
                  <div>Strike Price</div>
                  <div>&lt;</div>
                  <div className="label-input-row">
                    <div>Current Price -&nbsp;</div>
                    <div className="input-field input-field-sm">
                      <DecimalInput onChange={this.onTolerancePriceBelowChange} value={this.state.tolerancePriceBelow}></DecimalInput>
                      <div className="coin-symbol">%</div>
                    </div>
                  </div>
                </div>}
                {this.state.priceSettingsType.value === 4 && <div className="input-row mt-2">
                  <div className="label-input-row">
                    <div>Current Price -&nbsp;</div>
                    <div className="input-field input-field-sm">
                      <DecimalInput onChange={this.onTolerancePriceBelowChange} value={this.state.tolerancePriceBelow}></DecimalInput>
                      <div className="coin-symbol">%</div>
                    </div>
                  </div>
                  <div>&lt;</div>
                  <div>Strike Price</div>
                  <div>&lt;</div>
                  <div className="label-input-row">
                    <div>Current Price +&nbsp;</div>
                    <div className="input-field input-field-sm">
                      <DecimalInput onChange={this.onTolerancePriceAboveChange} value={this.state.tolerancePriceAbove}></DecimalInput>
                      <div className="coin-symbol">%</div>
                    </div>
                  </div>
                </div>}
              </>}
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