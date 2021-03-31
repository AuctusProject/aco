import './Airdrop.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Countdown from 'react-countdown';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatAcoRewardName, fromDecimals, numberWithCommas } from '../../util/constants';

class Airdrop extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  componentDidMount = () => {
  }

  componentDidUpdate = (prevProps) => {     
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }
  
  onClaimClick = () => {

  }

  getClaimableAmount = () => {
    if (!this.props.airdropUnclaimed) {
      return <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>
    }
    return (this.props.airdropUnclaimed.amount ? 
      fromDecimals(this.props.airdropUnclaimed.amount, 18) : "0.00")
  }

  formatCurrentOptionsLeft = () => {
    return numberWithCommas(Number(fromDecimals(this.props.currentOption.available, 18)).toFixed(0))
  }

  render() {
    return <div className="airdrop py-5">
      <div className="airdrop-title">Airdrop</div>
      {!this.isConnected() ?
        <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
          <div>CONNECT YOUR WALLET TO CHECK</div>
        </div> : 
        <div className="claim-row">
          <div>{this.getClaimableAmount()}</div>
          <div className="action-btn ml-3" onClick={this.onClaimClick}>CLAIM</div>
        </div>}
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
        <div className="airdrop-progress-fill" style={{width: '0%'}}></div>
      </div>
      {this.props.currentOption && <>
        <div className="current-option-section">
          <div className="current-option-title">CURRENT OPTION:</div>
          <div className="current-option-name">{formatAcoRewardName(this.props.currentOption)}</div>
        </div>
        <div className="current-option-left">
          <div className="current-option-left-value">{this.formatCurrentOptionsLeft()}</div>
          <div className="current-option-left-description">of the current strike left</div>
        </div>
        {this.props.nextOption && <div className="next-option-section">
          <div className="next-option-title">NEXT OPTION:</div>
          <div className="next-option-name">{formatAcoRewardName(this.props.nextOption)}</div>
        </div>}
      </>}
  </div>
  }
}

Airdrop.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Airdrop)