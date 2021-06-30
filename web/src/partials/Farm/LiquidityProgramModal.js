import './LiquidityProgramModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import DecimalInput from '../Util/DecimalInput'
import { fromDecimals, toDecimals, zero } from '../../util/constants'
import BigNumber from 'bignumber.js'
import RewardOptionCard from './RewardOptionCard'
import { balanceOf } from '../../util/contractHelpers/erc20Methods'
import { accountBalance } from '../../util/contractHelpers/acoRewardsMethods'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import StakeModal from './StakeModal'
import ClaimModal from './ClaimModal'
import UnstakeModal from './UnstakeModal'
import { error } from '../../util/sweetalert'
import AccountPoolPositionModal from './AccountPoolPositionModal'

class LiquidityProgramModal extends Component {
  constructor(props) {
    super(props)
    this.state = {stakeValue: "", unstakeValue: "", poolBalance: null, poolStakedBalance: null, unclaimedRewards: []}
  }

  componentDidMount = () => {
    this.loadData()
  }

  componentDidUpdate = (prevProps) => {    
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.accountToggle !== prevProps.accountToggle) {
      this.loadData()
    }
    if (this.props.toggleRewardUnclaimed !== prevProps.toggleRewardUnclaimed) {
      this.loadUnclaimedRewards()
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

      this.loadUnclaimedRewards()
    })
  }

  loadUnclaimedRewards = () => {
    if (this.props.rewardUnclaimed) {
      var unclaimedRewards = []
      for (let i=0; i<this.props.rewardUnclaimed.length; i++) {
        var unclaimed = this.props.rewardUnclaimed[i]
        for (let j=0; j<unclaimed.poolData.length; j++) {
          if (unclaimed.poolData[j].pid === this.props.pool.pid) {
            unclaimedRewards.push({
              aco: unclaimed.aco,
              expiryTime: unclaimed.expiryTime,
              underlying: unclaimed.underlying,
              strikeAsset: unclaimed.strikeAsset,
              strikePrice: unclaimed.strikePrice,
              isCall: unclaimed.isCall,
              amount: unclaimed.poolData[j].amount
            })
            break;
          }
        }
      }
      this.setState({unclaimedRewards: unclaimedRewards})
    }
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

  onStakeValueChange = (value) => {
    this.setState({stakeValue: value})
  }

  onUnstakeValueChange = (value) => {
    this.setState({unstakeValue: value})
  }

  onStakeClick = () => {
    if (!this.state.stakeValue || Number(this.state.stakeValue) === 0) {
      error("You must input a value greater than 0.", "Invalid value")
    }
    else {
      var stakeData = {
        stakeValue: this.state.stakeValue,
        pool: this.props.pool
      }
      this.setState({stakeData: stakeData})
    }
  }

  onClaimClick = () => {
    var claimData = {
      pid: this.props.pool.pid
    }
    this.setState({claimData: claimData})
  }

  onUnstakeClick = () => {
    if (!this.state.unstakeValue || Number(this.state.unstakeValue) === 0) {
      error("You must input a value greater than 0.", "Invalid value")
    }
    else {
      var unstakeData = {
        unstakeValue: this.state.unstakeValue,
        pool: this.props.pool,
        isExit: new BigNumber(this.state.poolStakedBalance).eq(new BigNumber(toDecimals(this.state.unstakeValue, 18)))
      }
      this.setState({unstakeData: unstakeData})
    }
  }

  onExitClick = () => {
    var unstakeData = {
      unstakeValue: fromDecimals(this.state.poolStakedBalance, 18, 18),
      pool: this.props.pool,
      isExit: true
    }
    this.setState({unstakeData: unstakeData})
  }

  onHideStake = (refresh) => {
    if (refresh) {
      this.loadData()
      this.props.loadUnclaimedRewards()
    }
    this.setState({stakeData: null})
  }

  onHideUnstake = (refresh) => {
    if (refresh) {
      this.loadData()
      this.props.loadUnclaimedRewards()
    }
    this.setState({unstakeData: null})
  }

  onHideClaim = (refresh) => {
    if (refresh) {
      this.props.loadUnclaimedRewards()
    }
    this.setState({claimData: null})
  }

  onHidePoolPosition = () => {
    this.setState({showPoolPosition: false})
  }

  showPoolPosition = () => {
    this.setState({showPoolPosition: true})
  }

  getStakedValue = (  ) => {
    if (this.props.pool.lpValuePerShare !== undefined && this.state.poolStakedBalance !== null) {
      return "($"+fromDecimals(new BigNumber(this.state.poolStakedBalance).times(this.props.pool.lpValuePerShare), this.props.pool.decimals, 2)+")"
    }
    return "(...)"
  }

  showPoolDetailsLink = () => {
    return this.props.pool && this.props.pool.poolData && this.state.poolStakedBalance && new BigNumber(this.state.poolStakedBalance).gt(zero)
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
              <div className="reward-card-balance reward-card-balance-mb">
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
              <div className={"reward-card-balance " + (this.showPoolDetailsLink() ? "" : "reward-card-balance-mb")}>
                {this.state.poolStakedBalance ? fromDecimals(this.state.poolStakedBalance, this.props.pool.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}
                <div className="reward-card-balance-value">{this.getStakedValue()}</div>
              </div>
              {this.showPoolDetailsLink() && <div className="reward-card-link aco-link" onClick={this.showPoolPosition}>VIEW DETAILS</div>}
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
        {this.state.unclaimedRewards && this.state.unclaimedRewards.length > 0 && <div className="unclaimed-rewards">
          <div className="unclaimed-rewards-title">
            Unclaimed Rewards
          </div>
          {this.state.unclaimedRewards.map(reward => 
            <RewardOptionCard key={reward.aco} option={reward}/>
          )}
        </div>}
        {this.state.stakeData && <StakeModal data={this.state.stakeData} onHide={this.onHideStake}/>}
        {this.state.claimData && <ClaimModal data={this.state.claimData} onHide={this.onHideClaim}/>}
        {this.state.unstakeData && <UnstakeModal data={this.state.unstakeData} onHide={this.onHideUnstake}/>}
        {this.state.showPoolPosition && <AccountPoolPositionModal pool={this.props.pool} balance={this.state.poolStakedBalance} onHide={this.onHidePoolPosition}/>}
      </Modal.Body>
    </Modal>
  }
}

LiquidityProgramModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(LiquidityProgramModal)