import './RewardOptionCard.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import OptionBadge from '../OptionBadge'
import { formatDate, fromDecimals, getTimeToExpiry } from '../../util/constants'

class RewardOptionCard extends Component {
  constructor(props) {
    super(props)
    this.state = {}
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

  render() {
    var option = this.props.option
    return <div className="option-reward-card">
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
          <div>{formatDate(option.expiryTime)}</div>
          <div className="time-to-expiry">{this.getTimeToExpiryLabel(option.expiryTime)}</div>
        </div>
      </div>
      <div>
        <div className="option-reward-card-detail-title">AVAILABLE</div>
        <div className="option-reward-card-detail-content">{fromDecimals(option.amount, 18)}</div>
      </div>
  </div>
  }
}

RewardOptionCard.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(RewardOptionCard)