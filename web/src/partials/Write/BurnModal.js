import './BurnModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import { getOptionCollateralFormatedValue, getTokenAmount, getOptionTokenAmountFormatedValue, getCollateralInfo, burn } from '../../util/acoTokenMethods'
import { fromDecimals, toDecimals } from '../../util/constants'
import { checkTransactionIsMined } from '../../util/web3Methods'
import Web3Utils from 'web3-utils'
import StepsModal from '../StepsModal/StepsModal'
import DecimalInput from '../Util/DecimalInput'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'

class BurnModal extends Component {
  constructor(props) {
    super(props)    
    this.state = { collateralValue: "", optionsAmount: ""}
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair || 
      this.props.position !== prevProps.position ||
      this.props.accountToggle !== prevProps.accountToggle) {
        this.props.onHide(false)
    }
  }

  onConfirm = () => {
    if (this.canConfirm()) {
      var stepNumber = 0
      this.setStepsModalInfo(++stepNumber)
      burn(this.context.web3.selectedAccount, this.props.position.option, toDecimals(this.state.optionsAmount, this.props.position.option.underlyingInfo.decimals).toString())
      .then(result => {
        if (result) {
          this.setStepsModalInfo(++stepNumber)
          checkTransactionIsMined(result)
          .then(result => {
            if(result) {
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
    var title = "Burn"
    var subtitle = "Burn to redeem collateral"
    var img = null
    var option = this.props.position.option
    if (stepNumber === 1) {
      subtitle =  "Confirm on Metamask to burn "+this.state.optionsAmount+" "+option.acoTokenInfo.symbol+", you'll redeem back "+this.state.collateralValue+" "+this.getCollateralAssetSymbol()+" from your collateral."
      img = <MetamaskLargeIcon/>
    }
    else if (stepNumber === 2) {
      subtitle =  "Burning "+this.state.optionsAmount+" "+option.acoTokenInfo.symbol+"..."
      img = <SpinnerLargeIcon/>
    }
    else if (stepNumber === 3) {
      subtitle = "You have successfully burned the options and received back "+this.state.collateralValue+" "+this.getCollateralAssetSymbol()+" on your wallet."
      img = <DoneLargeIcon/>
    }
    else if (stepNumber === -1) {
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon/>
    }

    var steps = []
    steps.push({title: "Burn", progress: stepNumber > 2 ? 100 : 0, active: true})
    this.setState({
      stepsModalInfo: {
        title: title, 
        subtitle: subtitle, 
        steps: steps, 
        img: img, 
        isDone: (stepNumber === 3 || stepNumber === -1), 
        onDoneButtonClick: (stepNumber === 3 ? this.onDoneButtonClick : this.onHideStepsModal)}
    })
  }

  onDoneButtonClick = () => {
    this.props.onHide(true)
  }

  onHideStepsModal = () => {
    this.setState({stepsModalInfo: null})
  }
  
  isInsufficientFunds = () => {
    return new Web3Utils.BN(this.props.position.unassignableCollateral).lt(toDecimals(this.state.collateralValue, this.getCollateralDecimals()))
  }

  canConfirm = () => {
    return this.state.optionsAmount !== null && this.state.optionsAmount !== "" && !this.isInsufficientFunds()
  }

  onCollateralChange = (value) => {
    this.setState({ collateralValue: value, optionsAmount: this.getOptionsAmount(value) })
  }

  onMaxClick = () => {
    var balance = fromDecimals(this.props.position.unassignableCollateral, this.getCollateralDecimals())
    this.onCollateralChange(balance)
  }

  getOptionsAmount = (collateralValue) => {
    return this.props.position.option.isCall ? collateralValue : this.getOptionsAmountForPut(collateralValue)
  }

  getOptionsAmountForPut = (collateralValue) => {
    return getTokenAmount(this.props.position.option, collateralValue)
  }

  getCollateralValue = (optionsAmount) => {
    return this.props.position.option.isCall ? optionsAmount : this.getCollateralValueForPut(optionsAmount)
  }

  getCollateralValueForPut = (optionsAmount) => {
    return fromDecimals(fromDecimals(new Web3Utils.BN(this.props.position.option.strikePrice).mul(toDecimals(optionsAmount, this.props.position.option.underlyingInfo.decimals)), parseInt(this.props.position.option.strikeAssetInfo.decimals)), parseInt(this.props.position.option.underlyingInfo.decimals))
  }

  getCollateralDecimals = () => {
    return getCollateralInfo(this.props.position.option).decimals
  }

  getCollateralAssetSymbol = () => {
    return getCollateralInfo(this.props.position.option).symbol
  }

  onOptionsAmountChange = (value) => {
    this.setState({ optionsAmount: value, collateralValue: this.getCollateralValue(value) })
  }

  render() {
    return (<Modal className="aco-modal burn-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Header closeButton>BURN</Modal.Header>
      <Modal.Body>
        <div className="burn-options">
          <div className="page-subtitle">Burn options to redeem your collateral back before expiration</div>
          <div className="confirm-card">
          <div className="confirm-card-header">{this.props.position.option.acoTokenInfo.symbol}</div>
          <div className={"confirm-card-body "+(this.isInsufficientFunds() ? "insufficient-funds-error" : "")}>
            <div className="balance-column">
              <div>Amount available to burn: <span>{getOptionTokenAmountFormatedValue(this.props.position.unassignableTokens,this.props.position.option)} options</span></div>
              <div>Amount in collateral: <span>{getOptionCollateralFormatedValue(this.props.position.unassignableCollateral, this.props.position.option)}</span></div>
            </div>
            <div className="card-separator"></div>
            <div className="input-row">
              <div className="input-column">
                <div className="input-label">{this.getCollateralAssetSymbol()} to redeem back</div>
                <div className="input-field">
                  <DecimalInput tabIndex="-1" onChange={this.onCollateralChange} value={this.state.collateralValue}></DecimalInput>
                  <div className="max-btn" onClick={this.onMaxClick}>MAX</div>
                </div>
              </div>
              <div className="equal-symbol">=</div>
              <div className="input-column">
                <div className="input-label">Amount of options to burn</div>
                <div className="input-field">
                  <DecimalInput tabIndex="-1" onChange={this.onOptionsAmountChange} value={this.state.optionsAmount}></DecimalInput>
                </div>
              </div>
            </div>
            <div className="card-separator"></div>
            <div>
            </div>
          </div>
          <div className="confirm-card-actions">
            <div className="aco-button cancel-btn" onClick={() => this.props.onHide(false)}>Cancel</div>
            <div className={"aco-button action-btn "+(this.canConfirm() ? "" : "disabled")} onClick={this.onConfirm}>Confirm</div>
          </div>
        </div>
        {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
        </div>
      </Modal.Body>
    </Modal>)
  }
}

BurnModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(BurnModal)