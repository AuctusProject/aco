import './WrittenOptionsPositions.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getOptionsPositions } from '../../util/acoFactoryMethods'
import { getOptionCollateralFormatedValue, getOptionTokenAmountFormatedValue, redeem, getFormattedOpenPositionAmount, getOptionFormattedPrice } from '../../util/acoTokenMethods'
import { ONE_SECOND, getNumberWithSignal, formatDate, PositionsLayoutMode, getTimeToExpiry } from '../../util/constants'
import { checkTransactionIsMined } from '../../util/web3Methods'
import StepsModal from '../StepsModal/StepsModal'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import Loading from '../Util/Loading'
import OptionBadge from '../OptionBadge'

class WrittenOptionsPositions extends Component {
  constructor(props) {
    super(props)
    this.state = { positions: null }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair ||
        this.props.accountToggle !== prevProps.accountToggle ||
        (this.props.refresh !== prevProps.refresh && this.props.refresh)) {
      if (this.props.loadedPositions) {
        this.props.loadedPositions(null)
      }
      this.setState({ positions: null })
      this.componentDidMount()
    }
  }

  componentDidMount = () => {
      if ((this.props.selectedPair || this.props.isOtcPositions) && this.context.web3.selectedAccount) {
          this.props.updated()
          getOptionsPositions(this.props.selectedPair, this.context.web3.selectedAccount, this.props.isOtcPositions).then(positions => {
            if (this.props.loadedPositions) {
              this.props.loadedPositions(positions)
            }
            this.setState({ positions: positions })
          })
    }
  }

  onBurnClick = (position) => () => {
    if (this.isBurnable(position)) {
      this.props.onBurnPositionSelect(position)
    }
  }

  isExpired = (position) => {
    return (position.option.expiryTime * ONE_SECOND) < new Date().getTime()
  }

  isBurnable = (position) => {
    return position.unassignableCollateral > 0
  }

  onRedeemClick = (position) => () => {
    if (this.isExpired(position)) {
      var stepNumber = 0
      this.setStepsModalInfo(++stepNumber)
      redeem(this.context.web3.selectedAccount, position.option)
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
    var title = "Redeem"
    var subtitle = "Redeem unassigned collateral"
    var img = null
    if (stepNumber === 1) {
      subtitle = "Confirm on Metamask to redeem back your collateral."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 2) {
      subtitle = "Redeeming..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = "You have successfully redeemed your collateral."
      img = <DoneLargeIcon />
    }
    else if (stepNumber === -1) {
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon />
    }

    var steps = []
    steps.push({ title: "Redeem", progress: stepNumber > 2 ? 100 : 0, active: true })
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
    this.componentDidMount()
    this.setState({ stepsModalInfo: null })
  }

  onHideStepsModal = () => {
    this.setState({ stepsModalInfo: null })
  }

  getTimeToExpiryLabel = (expiryTime) => {
    var timeToExpiry = getTimeToExpiry(expiryTime)
    return timeToExpiry.days > 0 ? 
        `${timeToExpiry.days}d ${timeToExpiry.hours}h ${timeToExpiry.minutes}m` :
        `${timeToExpiry.hours}h ${timeToExpiry.minutes}m`;
  }

  render() {
    return (!this.state.positions ? (this.props.mode === PositionsLayoutMode.Advanced ? <Loading/> : null) :
      (this.state.positions.length === 0  ? <></> :
       <div className="written-options-positions">
      <div className="page-title">MANAGE YOUR WRITTEN OPTIONS POSITIONS</div>
      <table className="aco-table mx-auto table-responsive-md">
        <thead>
          <tr>
            <th>TYPE</th>
            {this.props.isOtcPositions && <th>UNDERLYING</th>}
            <th>STRIKE</th>
            <th>EXPIRATION</th>
            <th>TOTAL MINTED</th>
            {this.props.mode === PositionsLayoutMode.Advanced && <th>WALLET BALANCE</th>}
            {this.props.mode === PositionsLayoutMode.Advanced && <th>OPEN POSITION</th>}
            <th>TOTAL COLLATERAL{this.props.mode === PositionsLayoutMode.Advanced && <><br />(assignable/unassignable)</>}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>          
          {(!this.state.positions || this.state.positions.length === 0) && 
              <tr>
                {!this.state.positions && <td colSpan={this.props.mode === PositionsLayoutMode.Advanced ? "6" : "5"}>Loading...</td>}
                {this.state.positions && this.state.positions.length === 0 && <td colSpan={this.props.mode === PositionsLayoutMode.Advanced ? "6" : "5"}>{this.props.selectedPair && ` for ${this.props.selectedPair.underlyingSymbol}${this.props.selectedPair.strikeAssetSymbol}`}</td>}
              </tr>
          }
          {this.state.positions.map(position =>
            <tr key={position.option.acoToken}>
              <td><OptionBadge isCall={position.option.isCall}></OptionBadge></td>
              {this.props.isOtcPositions && <td>{position.option.underlyingInfo.symbol}</td>}
              <td>{getOptionFormattedPrice(position.option)}</td>
              <td>
				        <div className="expiration-cell">
                  <div>{formatDate(position.option.expiryTime, false)}</div>
                  <div className="time-to-expiry">{this.getTimeToExpiryLabel(position.option.expiryTime)}</div>
                </div>
			        </td>
              <td>{getOptionTokenAmountFormatedValue(position.currentCollateralizedTokens, position.option)}</td>
              {this.props.mode === PositionsLayoutMode.Advanced && <td>{getOptionTokenAmountFormatedValue(position.balance, position.option)}</td>}
              {this.props.mode === PositionsLayoutMode.Advanced && <td>{getNumberWithSignal(getFormattedOpenPositionAmount(position))}</td>}
              <td>{getOptionCollateralFormatedValue(position.currentCollateral, position.option)}
              {this.props.mode === PositionsLayoutMode.Advanced && <><br />({getOptionCollateralFormatedValue(position.assignableCollateral, position.option)}/{getOptionCollateralFormatedValue(position.unassignableCollateral, position.option)})</>}
              </td>
              <td>
                {!this.props.isOtcPositions && !this.isExpired(position) && 
                <div className={"grid-btn action-btn" + (this.isBurnable(position) ? "" : " disabled")} title={(this.isBurnable(position) ? "" : "You don't have any options to burn")} onClick={this.onBurnClick(position)}>Reduce Position</div>}
                {(this.props.isOtcPositions || this.isExpired(position)) && 
                <div className={"grid-btn action-btn" + (this.isExpired(position) ? "" : " disabled")} title={(this.isExpired(position) ? "" : "You can only redeem you collateral back after expiration.")} onClick={this.onRedeemClick(position)}>Redeem Collateral</div>}
              </td>
            </tr>)}
        </tbody>
      </table>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
    </div>))
  }
}

WrittenOptionsPositions.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(WrittenOptionsPositions)