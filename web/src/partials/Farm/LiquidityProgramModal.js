import './LiquidityProgramModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import DecimalInput from '../Util/DecimalInput'
import { fromDecimals, getTimeToExpiry } from '../../util/constants'
import BigNumber from 'bignumber.js'
import RewardOptionCard from './RewardOptionCard'
import { balanceOf } from '../../util/erc20Methods'
import { accountBalance } from '../../util/acoRewardsMethods'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import StakeModal from './StakeModal'

class LiquidityProgramModal extends Component {
  constructor(props) {
    super(props)
    this.state = {stakeValue: "", unstakeValue: "", poolBalance: null, poolStakedBalance: null}
  }

  componentDidMount = () => {
    this.loadData()
  }

  componentDidUpdate = (prevProps) => {    
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.loadData()
    }
  }

  loadData = () => {
    this.setState({poolBalance: null, poolStakedBalance: null}, () => {
      balanceOf(this.props.pool.address, this.context.web3.selectedAccount).then(balance => {
        this.setState({poolBalance: balance})
      })

      accountBalance(this.props.pool.pid, this.context.web3.selectedAccount).then(balance => {
        this.setState({poolStakedBalance: balance})
      })
    })
  }


  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  getMultipliedValue = (percentage, value) => {
    return fromDecimals(new BigNumber(percentage).times(new BigNumber(value)), this.props.pool.decimals, this.props.pool.decimals, 0)
  }

  onStakePercentageClick = (percentage) => () => {
    var calculatedValue = this.getMultipliedValue(percentage, this.state.poolBalance)
    this.onStakeValueChange(calculatedValue)
  }

  onUnstakePercentageClick = (percentage) => () => {
    var calculatedValue = this.getMultipliedValue(percentage, this.state.poolStakedBalance)
    this.onUnstakeValueChange(calculatedValue)
  }
  
  getTimeToExpiryLabel = (expiryTime) => {
    var timeToExpiry = getTimeToExpiry(expiryTime)
    return timeToExpiry.days > 0 ? 
        `(${timeToExpiry.days}d ${timeToExpiry.hours}h ${timeToExpiry.minutes}m)` :
        `(${timeToExpiry.hours}h ${timeToExpiry.minutes}m)`;
  }

  onStakeValueChange = (value) => {
    this.setState({stakeValue: value})
  }

  onUnstakeValueChange = (value) => {
    this.setState({unstakeValue: value})
  }

  onStakeClick = () => {
    var stakeData = {
      stakeValue: this.state.stakeValue,
      pool: this.props.pool
    }
    this.setState({stakeData: stakeData})
  }

  onHideStake = (refresh) => {
    if (refresh) {
      this.loadData()
    }
    this.setState({stakeData: null})
  }

  render() {
    return <Modal className="aco-modal no-header rewards-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Header closeButton></Modal.Header>
      <Modal.Body>
        <div className="rewards-title">
          {this.props.pool.name} REWARDS
        </div>
        <div className="reward-cards">
          <div className="reward-card">
            <div className="reward-card-content">
              <div className="reward-card-title">
                {this.props.pool.name} AVAILABLE
              </div>
              <div className="reward-card-balance">
                {this.state.poolBalance ? fromDecimals(this.state.poolBalance, this.props.pool.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}
              </div>
              <div className="reward-card-input">
                <div className="input-field">
                  <DecimalInput onChange={this.onStakeValueChange} value={this.state.stakeValue}></DecimalInput>
                </div>
                <div className="action-btn" onClick={this.onStakeClick}>STAKE</div>
              </div>
              <div className="reward-card-percentage-buttons">
                <div className="outline-btn reward-card-percentage-button" onClick={this.onStakePercentageClick(0.25)}>25%</div>
                <div className="outline-btn reward-card-percentage-button" onClick={this.onStakePercentageClick(0.5)}>50%</div>
                <div className="outline-btn reward-card-percentage-button" onClick={this.onStakePercentageClick(0.75)}>75%</div>
                <div className="outline-btn reward-card-percentage-button" onClick={this.onStakePercentageClick(1)}>100%</div>
              </div>
            </div>
            <div className="reward-action">
              <div className="action-btn" onClick={this.onClaimClick}>CLAIM REWARDS</div>
            </div>
          </div>
          <div className="reward-card">
            <div className="reward-card-content">
              <div className="reward-card-title">
                {this.props.pool.name} STAKED
              </div>
              <div className="reward-card-balance">
              {this.state.poolStakedBalance ? fromDecimals(this.state.poolStakedBalance, this.props.pool.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}
              </div>
              <div className="reward-card-input">
                <div className="input-field">
                  <DecimalInput onChange={this.onUnstakeValueChange} value={this.state.unstakeValue}></DecimalInput>
                </div>
                <div className="action-btn" onClick={this.onUnstakeClick}>UNSTAKE</div>
              </div>
              <div className="reward-card-percentage-buttons">
                <div className="outline-btn reward-card-percentage-button" onClick={this.onUnstakePercentageClick(0.25)}>25%</div>
                <div className="outline-btn reward-card-percentage-button" onClick={this.onUnstakePercentageClick(0.5)}>50%</div>
                <div className="outline-btn reward-card-percentage-button" onClick={this.onUnstakePercentageClick(0.75)}>75%</div>
                <div className="outline-btn reward-card-percentage-button" onClick={this.onUnstakePercentageClick(1)}>100%</div>
              </div>
            </div>
            <div className="reward-action">
              <div className="outline-btn" onClick={this.onExitClick}>EXIT: CLAIM &amp; UNSTAKE</div>
            </div>
          </div>
        </div>
        <div className="unclaimed-rewards">
          <div className="unclaimed-rewards-title">
            Unclaimed Rewards
          </div>
          <RewardOptionCard />
        </div>
        {this.state.stakeData && <StakeModal data={this.state.stakeData} onHide={this.onHideStake}/>}
      </Modal.Body>
    </Modal>
  }
}

LiquidityProgramModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(LiquidityProgramModal)