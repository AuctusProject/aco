import './ExercisePositions.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import OptionBadge from '../OptionBadge'
import { getOptionFormattedPrice, getFormattedOpenPositionAmount } from '../../util/acoTokenMethods'
import { listPositionsForExercise } from '../../util/acoFactoryMethods'
import { confirm } from '../../util/sweetalert'
import { getBinanceSymbolForPair, fromDecimals, formatDate } from '../../util/constants'


class ExercisePositions extends Component {
  constructor() {
    super()
    this.state = {positions: null}
  }
  
  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair ||
      this.props.accountToggle !== prevProps.accountToggle ||
      (this.props.refresh !== prevProps.refresh && this.props.refresh)) {
      this.componentDidMount()
    }
  }

  componentDidMount = () => {
    this.props.updated()
    listPositionsForExercise(this.props.selectedPair, this.context.web3.selectedAccount).then(positions => {
      this.setState({positions: positions})
    })
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
    var pairSymbol = getBinanceSymbolForPair(this.props.selectedPair)
    var price = this.context.ticker && this.context.ticker.data[pairSymbol] && this.context.ticker.data[pairSymbol].currentClosePrice
    var option = position.option
    var formattedStrikePrice = fromDecimals(option.strikePrice, option.strikeAssetInfo.decimals)
    if ((formattedStrikePrice > price && option.isCall) || (formattedStrikePrice < price && !option.isCall)) {
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

  render() {
    return <div>
        <table className="aco-table mx-auto">
          <thead>
            <tr>
              <th>TYPE</th>
              <th>SYMBOL</th>
              <th>STRIKE</th>
              <th>EXPIRATION</th>
              <th>AVAILABLE TO EXERCISE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(!this.state.positions || this.state.positions.length === 0) && 
              <tr>
                {!this.state.positions && <td colSpan="6">Loading...</td>}
                {this.state.positions && this.state.positions.length === 0 && <td colSpan="6">No positions for {this.props.selectedPair.underlyingSymbol}{this.props.selectedPair.strikeAssetSymbol}</td>}
              </tr>
            }
            {this.state.positions && this.state.positions.map(position => 
            <tr key={position.option.acoToken}>
              <td><OptionBadge isCall={position.option.isCall}></OptionBadge></td>
              <td>{position.option.acoTokenInfo.symbol}</td>
              <td>{getOptionFormattedPrice(position.option)}</td>
              <td>{formatDate(position.option.expiryTime)}</td>
              <td>{getFormattedOpenPositionAmount(position)}</td>
              <td>
              <div className="action-btn" onClick={this.onExerciseClick(position)}>EXERCISE</div>
              </td>
            </tr>)}
          </tbody>
        </table>      
      </div>
  }
}

ExercisePositions.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(ExercisePositions)