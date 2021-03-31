import './LiquidityProgram.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import LiquidityProgramModal from './LiquidityProgramModal'
import { listRewardsData } from '../../util/acoRewardsMethods'
import { airdropClaimStart, ONE_SECOND, formatAcoRewardName, numberWithCommas, acoRewardsPools } from '../../util/constants'

class LiquidityProgram extends Component {
  constructor(props) {
    super(props)
    this.state = { selectedPid: null }
  }

  componentDidMount = () => {
    this.loadData()
  }

  componentDidUpdate = (prevProps) => {    
  }

  loadData = (force = false) => {
    if (this.farmStarted()) {
      listRewardsData(force).then((rewardsData) => {
        this.setState({rewardsData: rewardsData})
      })
    }
    else {
      this.setState({rewardsData: acoRewardsPools})
    }
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  onLiquiditySelect = (pid) => {
    this.setState({selectedPid: pid})
  }

  farmStarted = () => {
    return (airdropClaimStart * ONE_SECOND) < new Date().getTime()
  }

  render() {
    return <div className="liquidity-program">
      <div className="liquidity-program-title">Join our liquidity programs to earn more options</div>
      <div className="liquidity-program-pools">
        {this.state.rewardsData && this.state.rewardsData.map(rewardData => (
          <div key={rewardData.pid} className="liquidity-card" onClick={() => this.onLiquiditySelect(rewardData)}>
            <div className="liquidity-card-icon">
              {rewardData.image.map(img => <img key={img} alt="" src={img}></img>)}
            </div>
            <div className="liquidity-card-title">{rewardData.name}</div>
            <div className="liquidity-card-rewards-title">{this.farmStarted() ? "Rewards per $1000 per month" : "Rewards per month"}</div>
            <div className="liquidity-card-rewards-value">{numberWithCommas(rewardData.monthly1kReward)}</div>
            <div className="liquidity-card-rewards-option">{formatAcoRewardName(rewardData.currentAco)}</div>
          </div>
        ))}
      </div>
      {this.state.selectedPid !== null && <LiquidityProgramModal pool={this.state.selectedPid} {...this.props} onHide={() => this.onLiquiditySelect(null)} />}
  </div>
  }
}

LiquidityProgram.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(LiquidityProgram)