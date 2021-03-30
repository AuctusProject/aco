import './Airdrop.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Countdown from 'react-countdown';
import { getClaimableAco } from '../../util/acoApi';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatAcoRewardName, fromDecimals, numberWithCommas } from '../../util/constants';
import { claim, getClaimableAcos } from '../../util/acoDistributorMethods';

class Airdrop extends Component {
  constructor(props) {
    super(props)
    this.state = { airdropUnclaimed: null, currentOption: null, nextOption: null }
  }

  componentDidMount = () => {
    this.refreshClaimable()
    getClaimableAcos("8000000000000000000000000").then(claimableAcos => 
      this.setState({
        currentOption: claimableAcos && claimableAcos[0] ? claimableAcos[0]: null,
        nextOption: claimableAcos && claimableAcos[1] ? claimableAcos[1]: null,
      })
    )
  }

  refreshClaimable = () => {
    if (this.isConnected()) {
      getClaimableAco(this.context.web3.selectedAccount).then(claimable => 
        this.setState({airdropUnclaimed: claimable })
      )
    }
  }

  componentDidUpdate = (prevProps) => {    
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.refreshClaimable()
    }    
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
    if (!this.state.airdropUnclaimed) {
      return <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>
    }
    return (this.state.airdropUnclaimed[0] && this.state.airdropUnclaimed[0].amount) ? 
      fromDecimals(this.state.airdropUnclaimed[0].amount, 18) : "0.00"
  }

  formatCurrentOptionsLeft = () => {
    return numberWithCommas(Number(fromDecimals(this.state.currentOption.amount, 18)).toFixed(0))
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
      {this.state.currentOption && <>
        <div className="current-option-section">
          <div className="current-option-title">CURRENT OPTION:</div>
          <div className="current-option-name">{formatAcoRewardName(this.state.currentOption)}</div>
        </div>
        <div className="current-option-left">
          <div className="current-option-left-value">{this.formatCurrentOptionsLeft()}</div>
          <div className="current-option-left-description">of the current strike left</div>
        </div>
        {this.state.nextOption && <div className="next-option-section">
          <div className="next-option-title">NEXT OPTION:</div>
          <div className="next-option-name">{formatAcoRewardName(this.state.nextOption)}</div>
        </div>}
      </>}
  </div>
  }
}

Airdrop.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Airdrop)