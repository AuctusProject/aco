import './ExercisePositions.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import OptionBadge from '../OptionBadge'
import { getOptionFormattedPrice, getFormattedOpenPositionAmount } from '../../util/contractHelpers/acoTokenMethods'
import { listPositionsForExercise } from '../../util/contractHelpers/acoFactoryMethods'
import { confirm } from '../../util/sweetalert'
import { fromDecimals, formatDate, PositionsLayoutMode, getTimeToExpiry } from '../../util/constants'

class ExercisePositions extends Component {
  constructor() {
    super()
    this.state = {positions: null}
  }
  
  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || 
      this.props.selectedPair !== prevProps.selectedPair ||
      this.props.accountToggle !== prevProps.accountToggle ||
      (this.props.refresh !== prevProps.refresh && this.props.refresh)) {
      if (this.props.loadedPositions) {
        this.props.loadedPositions(null)
      }
      this.setState({positions: null})
      this.componentDidMount()
    }
  }

  componentDidMount = () => {
    if ((this.props.isOtcPositions || this.props.selectedPair) && this.context.web3.selectedAccount) {
      this.props.updated()
      listPositionsForExercise(this.props.selectedPair, this.context.web3.selectedAccount, this.props.isOtcPositions).then(positions => {
        if (this.props.loadedPositions) {
          this.props.loadedPositions(positions)
        }
        this.setState({positions: positions})
      })
    }
  }

  setPosition = (position) => {
    this.setState({position: position})
  }

  onCancelClick = () => {
    this.setPosition(null)
  }

  onExerciseClick = (position) => () => {
    if (this.checkApiPrice(position)) {
      this.onExerciseConfirmed(position)
    }    
  }

  checkApiPrice = (position) => {
    var price = this.context.ticker && this.props.selectedPair && this.context.ticker[this.props.selectedPair.underlyingSymbol]
    var option = position.option
    var formattedStrikePrice = fromDecimals(option.strikePrice, option.strikeAssetInfo.decimals)
    if (price && ((formattedStrikePrice > price && option.isCall) || (formattedStrikePrice < price && !option.isCall))) {
      var baseText = "The API is indicating that currently <b>{UNDERLYING_SYMBOL} is {API_PRICE}</b>, are you sure you want to {ACTION_NAME} <b>{UNDERLYING_SYMBOL} for {STRIKE_PRICE}</b>?"
      var html = baseText.replace("{API_PRICE}", "$"+price)
      .replace("{ACTION_NAME}", (option.isCall ? "purchase" : "sell"))
      .replace("{UNDERLYING_SYMBOL}", this.props.selectedPair.underlyingSymbol)
      .replace("{UNDERLYING_SYMBOL}", this.props.selectedPair.underlyingSymbol)
      .replace("{STRIKE_PRICE}", formattedStrikePrice+" "+this.props.selectedPair.strikeAssetSymbol)
      confirm(null, (result) => {
        if (result) {
          this.onExerciseConfirmed(position)        
        }
      }, null, "ALERT", "Yes", "No", html)
      return false
    }
    else {
      return true
    }
    
  }

  onExerciseConfirmed = (position) => {
    this.props.setPosition(position)
  }

  onSellClick = (position) => () => {
    this.props.setSellPosition(position)
  }

  getTimeToExpiryLabel = (expiryTime) => {
    var timeToExpiry = getTimeToExpiry(expiryTime)
    return timeToExpiry.days > 0 ? 
        `(${timeToExpiry.days}d ${timeToExpiry.hours}h ${timeToExpiry.minutes}m)` :
        `(${timeToExpiry.hours}h ${timeToExpiry.minutes}m)`;
  }
  
  render() {
    return <div>
        {!this.state.positions ? null :
        (this.props.mode === PositionsLayoutMode.Basic && this.state.positions.length === 0  ? null :
        <table className="aco-table mx-auto table-responsive-md">
          <thead>
            <tr>
              <th>TYPE</th>
              {this.props.isOtcPositions && <th>UNDERLYING</th>}
              {this.props.mode === PositionsLayoutMode.Advanced && <th>SYMBOL</th>}
              <th>STRIKE</th>
              <th>EXPIRATION</th>
              <th>AVAILABLE TO EXERCISE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(!this.state.positions || this.state.positions.length === 0) && 
              <tr>
                {!this.state.positions && <td colSpan={this.props.mode === PositionsLayoutMode.Advanced ? "6" : "5"}>Loading...</td>}
                {this.state.positions && this.state.positions.length === 0 && <td colSpan={this.props.mode === PositionsLayoutMode.Advanced ? "6" : "5"}>No positions{this.props.selectedPair && ` for ${this.props.selectedPair.underlyingSymbol}${this.props.selectedPair.strikeAssetSymbol}`}</td>}
              </tr>
            }
            {this.state.positions && this.state.positions.map(position => 
            <tr key={position.option.acoToken}>
              <td><OptionBadge isCall={position.option.isCall}></OptionBadge></td>
              {this.props.isOtcPositions && <td>{position.option.underlyingInfo.symbol}</td>}
              {this.props.mode === PositionsLayoutMode.Advanced && <td>{position.option.acoTokenInfo.symbol}</td>}
              <td>{getOptionFormattedPrice(position.option)}</td>
              <td>
				        <div className="expiration-cell">
                  <div>{formatDate(position.option.expiryTime, false)}</div>
                  <div className="time-to-expiry">{this.getTimeToExpiryLabel(position.option.expiryTime)}</div>
                </div>
			        </td>
              <td>{getFormattedOpenPositionAmount(position)}</td>
              <td className={!this.props.isOtcPositions ? "exercise-actions-cell" : ""}>
                {!this.props.isOtcPositions && this.props.mode === PositionsLayoutMode.Basic && <div className="outline-btn" onClick={this.onSellClick(position)}>SELL EARLY</div>}
                <div className="action-btn" onClick={this.onExerciseClick(position)}>EXERCISE</div>
              </td>
            </tr>)}
          </tbody>
        </table>)}
      </div>
  }
}

ExercisePositions.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(ExercisePositions)