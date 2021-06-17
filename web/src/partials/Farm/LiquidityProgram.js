import './LiquidityProgram.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import LiquidityProgramModal from './LiquidityProgramModal'
import { listRewardsData } from '../../util/contractHelpers/acoRewardsMethods'
import { formatAcoRewardName, numberWithCommas } from '../../util/constants'
import { acoRewardsPools } from '../../util/network'

class LiquidityProgram extends Component {
  constructor(props) {
    super(props)
    this.state = { selectedPool: null, rewardsData: acoRewardsPools() }
  }

  componentDidMount = () => {
    this.loadData()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.componentDidMount()
    }
  }

  loadData = (force = false) => {
    listRewardsData(force).then((rewardsData) => {
      var selectedPool = this.state.selectedPool
      if (selectedPool != null) {
        for (let index = 0; index < rewardsData.length; index++) {
          const reward = rewardsData[index];
          if (reward.pid === selectedPool.pid) {
            selectedPool = reward
            break
          }
        };
      }
      this.setState({rewardsData: rewardsData, selectedPool: selectedPool})
    })
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  onLiquiditySelect = (pid) => {
    if (!this.isConnected()) {
      this.onConnectClick()
    }
    else {
      this.setState({selectedPool: pid})
    }
  }

  render() {
    return <div className="liquidity-program">
      <div className="liquidity-program-title">Join our liquidity programs to earn more options</div>
      <div className="liquidity-program-pools">
        {this.state.rewardsData && this.state.rewardsData.map(rewardData => (
          <div key={rewardData.pid} className="liquidity-card clickable" onClick={() => this.onLiquiditySelect(rewardData)}>
            <div className="liquidity-card-icon">
              {rewardData.image.map(img => <img key={img} alt="" src={img}></img>)}
            </div>
            <div className="liquidity-card-title">{rewardData.name}</div>
            <div className="liquidity-card-rewards-title">{"Rewards per $1000 per month"}</div>
            <div className="liquidity-card-rewards-value">{!rewardData.monthly1kReward ? "..." : numberWithCommas(rewardData.monthly1kReward)}</div>
            <div className="liquidity-card-rewards-option">{formatAcoRewardName(rewardData.currentAco)}</div>
          </div>
        ))}
      </div>
      {this.state.selectedPool !== null && <LiquidityProgramModal pool={this.state.selectedPool} {...this.props} onHide={() => this.onLiquiditySelect(null)} />}
  </div>
  }
}

LiquidityProgram.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(LiquidityProgram)