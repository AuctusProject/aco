import './Airdrop.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { acoAirdropAmounts, airdropClaimStart, formatAcoRewardName, fromDecimals, getTimeToExpiry, numberWithCommas, ONE_SECOND } from '../../util/constants';
import AirdropClaimModal from './AirdropClaimModal';
import BigNumber from 'bignumber.js';

class Airdrop extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  render() {
    return <div className="airdrop py-5">
      <div className="airdrop-title">Airdrop</div>
      <div className="claim-row">
        All options have been redeemed.
      </div>
      <div className="airdrop-progress">
        <div className="airdrop-step">
          <div className="airdrop-step-value">$0.50</div>
          <div className="airdrop-step-bar"></div>
        </div>
        <div className="airdrop-step">
          <div className="airdrop-step-value">$0.75</div>
          <div className="airdrop-step-bar"></div>
        </div>
        <div className="airdrop-step">
          <div className="airdrop-step-value">$1.00</div>
          <div className="airdrop-step-bar"></div>
        </div>
        <div className="airdrop-step">
          <div className="airdrop-step-value">$1.50</div>
          <div className="airdrop-step-bar"></div>
        </div>
        <div className="airdrop-step last">
          <div className="airdrop-step-value">$2.00</div>
          <div className="airdrop-step-bar"></div>
        </div>
        <div className="airdrop-progress-fill" style={{width: '100%'}}></div>
      </div>
  </div>
  }
}

Airdrop.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Airdrop)