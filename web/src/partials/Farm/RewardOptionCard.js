import './RewardOptionCard.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import OptionBadge from '../OptionBadge'
import { formatDate, fromDecimals, getTimeToExpiry } from '../../util/constants'
import ExerciseModal from '../Exercise/ExerciseModal'
import { confirm } from '../../util/sweetalert'
import { getPositionForOption } from '../../util/acoFactoryMethods'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import ClaimModal from './ClaimModal'
import { getOption } from '../../util/dataController'

class RewardOptionCard extends Component {
  constructor(props) {
    super(props)
    this.state = {exercisePosition: null, position: null}
  }

  componentDidMount = () => {
    this.loadPosition()
  }

  loadPosition = () => {
    if (this.props.showExercise) {
      getOption(this.props.option.aco).then(option => {
        getPositionForOption(option, this.context.web3.selectedAccount).then(position => {
          this.setState({position: position})
        })
      })
    }
  }

  formatPrice = () => {
    return Number(fromDecimals(this.props.option.strikePrice, 6)).toFixed(2) + " USDC"
  }

  
  getTimeToExpiryLabel = (expiryTime) => {
    var timeToExpiry = getTimeToExpiry(expiryTime)
    return timeToExpiry.days > 0 ? 
      `(${timeToExpiry.days}d ${timeToExpiry.hours}h ${timeToExpiry.minutes}m)` :
      `(${timeToExpiry.hours}h ${timeToExpiry.minutes}m)`;
  }

  onCancelClick = (refresh) => {
    if (refresh) {
      this.props.refresh()
    }
    this.setState({exercisePosition: null})
  }

  onExerciseClick = () => {
    if (this.checkApiPrice()) {
      this.onExerciseConfirmed()
    }    
  }

  onExerciseConfirmed = () => {
    this.setState({exercisePosition: this.state.position})
  }

  checkApiPrice = () => {
    var underlyingSymbol = "AUC"
    var price = this.context.ticker && this.context.ticker[underlyingSymbol]
    var option = this.props.option
    var formattedStrikePrice = fromDecimals(option.strikePrice, 6)
    if (price && ((formattedStrikePrice > price && option.isCall) || (formattedStrikePrice < price && !option.isCall))) {
      var baseText = "The API is indicating that currently <b>{UNDERLYING_SYMBOL} is {API_PRICE}</b>, are you sure you want to {ACTION_NAME} <b>{UNDERLYING_SYMBOL} for {STRIKE_PRICE}</b>?"
      var html = baseText.replace("{API_PRICE}", "$"+price.toFixed(2))
      .replace("{ACTION_NAME}", (option.isCall ? "purchase" : "sell"))
      .replace("{UNDERLYING_SYMBOL}", underlyingSymbol)
      .replace("{UNDERLYING_SYMBOL}", underlyingSymbol)
      .replace("{STRIKE_PRICE}", formattedStrikePrice+" USDC")
      confirm(null, (result) => {
        if (result) {
          this.onExerciseConfirmed()        
        }
      }, null, "ALERT", "Yes", "No", html)
      return false
    }
    else {
      return true
    }    
  }

  onClaimClick = () => {
    var pids = this.props.option && this.props.option.poolData.map(a => a.pid)
    var claimData = {}
    if (pids.length > 1) {
      claimData.pids = pids
    }
    else {
      claimData.pid = pids[0]
    }
    this.setState({claimData: claimData})
  }

  onHideClaim = (refresh) => {
    if (refresh) {
      this.props.loadUnclaimedRewards()
    }
    this.setState({claimData: null})
  }

  render() {
    var option = this.props.option
    return <div className={"option-reward-card " + ((this.props.showExercise || this.props.showClaim) ? "large-option-reward-card" : "")}>
      <div>
        <div className="option-reward-card-detail-title">TYPE</div>
        <div className="option-reward-card-detail-content">
          <OptionBadge isCall={option.isCall}/>
        </div>              
      </div>
      <div>
        <div className="option-reward-card-detail-title">STRIKE</div>
        <div className="option-reward-card-detail-content">{this.formatPrice()}</div>
      </div>
      <div>
        <div className="option-reward-card-detail-title">EXPIRATION</div>
        <div className="option-reward-card-detail-content">
          <div>{formatDate(option.expiryTime, false, true)}</div>
          <div className="time-to-expiry">{this.getTimeToExpiryLabel(option.expiryTime)}</div>
        </div>
      </div>
      <div>
        <div className="option-reward-card-detail-title">AVAILABLE</div>
        <div className="option-reward-card-detail-content">{fromDecimals(option.amount, 18)}</div>
      </div>
      {this.props.showExercise && <div>
        {this.state.position !== null ? 
          <div className="action-btn" onClick={this.onExerciseClick}>EXERCISE</div> :
          <FontAwesomeIcon icon={faSpinner} className="fa-spin m-auto"></FontAwesomeIcon>
        }
      </div>}
      {this.props.showClaim && <div>
        <div className="action-btn" onClick={this.onClaimClick}>CLAIM</div>
      </div>}
      {this.state.exercisePosition !== null && <ExerciseModal {...this.props} position={this.state.exercisePosition} onHide={this.onCancelClick}></ExerciseModal>}
      {this.state.claimData && <ClaimModal data={this.state.claimData} onHide={this.onHideClaim}/>}
  </div>
  }
}

RewardOptionCard.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(RewardOptionCard)