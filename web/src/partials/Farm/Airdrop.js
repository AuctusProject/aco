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
    this.state = { airdropProgress: null }
  }

  componentDidMount = () => {
    this.setAirdropProgress()
  }

  componentDidUpdate = (prevProps) => {    
    if (this.props.acosAvailable !== prevProps.acosAvailable) {
      this.setAirdropProgress()
    }
  }

  setAirdropProgress = () => {
    if (this.props.acosAvailable) {
      var progress = 0;
      for (var i = 0; i < this.props.acosAvailable.length; i++) {
        var acoAvailable = new BigNumber(this.props.acosAvailable[i].amount)
        var airdropAmount = new BigNumber(acoAirdropAmounts[i].amount)
        var distributedPercentage = airdropAmount.minus(acoAvailable).div(airdropAmount)
        progress += 0.2 * distributedPercentage
      }
      this.setState({airdropProgress: progress * 100})
    }
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }
  
  onClaimClick = () => {
    if (this.canClaim()){
      this.setState({claimData: this.props.airdropUnclaimed})
    }
  }

  onHideClaim = (refresh) => {
    if (refresh) {
      this.props.refreshAirdrop()
    }
    this.setState({claimData: null})
  }

  getClaimableAmount = () => {
    if (!this.props.airdropUnclaimed || this.state.airdropProgress === null) {
      return <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>
    }
    return (this.props.airdropUnclaimed.amount ?
      fromDecimals(this.props.airdropUnclaimed.amount, 18) : "0.00")
  }

  formatCurrentOptionsLeft = () => {
    return numberWithCommas(Number(fromDecimals(this.props.currentOption.available, 18)).toFixed(0))
  }

  canClaim = () => {
    return this.props.airdropUnclaimed && this.props.airdropUnclaimed.id !== undefined && this.props.airdropUnclaimed.id !== null && this.props.airdropUnclaimed.id !== "" && this.state.airdropProgress !== null
  }

  getTimeLeft = () => {
    var timeToExpiry = getTimeToExpiry(airdropClaimStart)
    var label = ""
    if (timeToExpiry.days > 0) {
      label += timeToExpiry.days
      label += " day"
      if (timeToExpiry.days > 1) {
        label += "s"
      }
      label += ", "
    }

    label += timeToExpiry.hours
    label += " hour"
    if (timeToExpiry.hours !== 0) {
      label += "s"
    }
    label += " and "

    label += timeToExpiry.minutes
    label += " minute"
    if (timeToExpiry.minutes !== 0) {
      label += "s"
    }

    return label
  }

  isClaimStarted = () => {
    return (airdropClaimStart * ONE_SECOND) < new Date().getTime()
  }

  render() {
    return <div className="airdrop py-5">
      <div className="airdrop-title">Airdrop</div>
      {!this.isConnected() ?
        <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
          <div>CONNECT YOUR WALLET TO CHECK</div>
        </div> : 
        (this.state.airdropProgress < 100 ? <div className="claim-row">
          <div>{this.getClaimableAmount()}</div>
          <div className={"action-btn ml-3 " + (!this.canClaim() ? "disabled" : "")} onClick={this.onClaimClick}>CLAIM</div>
        </div> :
        <div className="claim-row">
          All options have been redeemed.
        </div>
        )}
      {!this.isClaimStarted() && 
        <div className="claim-not-started">The claiming starts in {this.getTimeLeft()}, early claimants receive options with $0.50 strike price.</div>
      }
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
        <div className="airdrop-progress-fill" style={{width: this.state.airdropProgress+'%'}}></div>
      </div>
      {this.props.currentOption && <>
        <div className="current-option-section">
          <div className="current-option-title">CURRENT OPTION:</div>
          <div className="current-option-left">
            <div className="current-option-left-value">{this.formatCurrentOptionsLeft()}</div>
            <div className="current-option-left-description">left</div>
          </div>
          <div className="current-option-name">{formatAcoRewardName(this.props.currentOption)}</div>
        </div>
        {this.props.nextOption && <div className="next-option-section">
          <div className="next-option-title">NEXT OPTION:</div>
          <div className="next-option-name">{formatAcoRewardName(this.props.nextOption)}</div>
        </div>}
      </>}
      {this.state.claimData && <AirdropClaimModal data={this.state.claimData} onHide={this.onHideClaim}/>}
  </div>
  }
}

Airdrop.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Airdrop)