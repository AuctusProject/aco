import './RewardOptionCard.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import OptionBadge from '../OptionBadge'

class RewardOptionCard extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return <div className="option-reward-card">
      <div>
        <div className="option-reward-card-detail-title">TYPE</div>
        <div className="option-reward-card-detail-content">
          <OptionBadge isCall={true}/>
        </div>              
      </div>
      <div>
        <div className="option-reward-card-detail-title">STRIKE</div>
        <div className="option-reward-card-detail-content">0.75 USDC</div>
      </div>
      <div>
        <div className="option-reward-card-detail-title">EXPIRATION</div>
        <div className="option-reward-card-detail-content">
          <div>March 19, 2021 08:00UTC</div>
          <div className="time-to-expiry">(3d 16h 56m)</div>
        </div>
      </div>
      <div>
        <div className="option-reward-card-detail-title">AVAILABLE TO EXERCISE</div>
        <div className="option-reward-card-detail-content">1.000</div>
      </div>
  </div>
  }
}

RewardOptionCard.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(RewardOptionCard)