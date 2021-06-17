import './Farm.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Airdrop from '../partials/Farm/Airdrop'
import LiquidityProgram from '../partials/Farm/LiquidityProgram'
import { listClaimedAcos } from '../util/contractHelpers/acoDistributorMethods'
import { listClaimedRewards, listUnclaimedRewards } from '../util/contractHelpers/acoRewardsMethods'
import RewardChart from '../partials/Farm/RewardChart'
import RewardOptionCard from '../partials/Farm/RewardOptionCard'
import { balanceOf } from '../util/contractHelpers/erc20Methods'
import { getAvailableOptionsByUnderlying } from '../util/dataController'
import { auctusAddress, defaultAcoCreators } from '../util/network'


class Farm extends Component {
  constructor() {
    super()
    this.state = { loading: true, airdropUnclaimed: null, toggleRewardUnclaimed: false }
  }

  componentDidMount = () => {
    this.loadData()
  }

  componentDidUpdate = (prevProps) => {    
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.componentDidMount()
    } else if (this.props.accountToggle !== prevProps.accountToggle) {
      this.loadData()
    }    
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  loadData = () => {
    this.getAirdropClaimedAcos()
    this.getRewardClaimedAcos()
    this.getRewardUnclaimedAcos()
    this.getAcoBalances()
  } 

  getRewardClaimedAcos = () => {
    if (this.isConnected()) {
      listClaimedRewards(this.context.web3.selectedAccount).then((claimed) => {
        this.setState({rewardClaimed: claimed})
      })
    } else {
      this.setState({rewardClaimed: []})
    }
  }

  getRewardUnclaimedAcos = () => {
    if (this.isConnected()) {
      listUnclaimedRewards(this.context.web3.selectedAccount).then((unclaimed) => {
        this.setState({rewardUnclaimed: unclaimed, toggleRewardUnclaimed: !this.state.toggleRewardUnclaimed})
      })
    } else {
      this.setState({rewardUnclaimed: []})
    }
  }

  getAirdropClaimedAcos = () => {
    if (this.isConnected()) {
      listClaimedAcos(this.context.web3.selectedAccount).then((claimed) => {
        this.setState({airdropClaimed: claimed})
      })
    } else {
      this.setState({airdropClaimed: []})
    }
  }

  getAcoBalances = () => {
    if (this.isConnected()) {
      getAvailableOptionsByUnderlying(auctusAddress()).then((acos) => {
        const promises = []
        const account = this.context.web3.selectedAccount
        for (let i = 0; i < acos.length; ++i) {
          promises.push(balanceOf(acos[i].acoToken, account))
        }
        Promise.all(promises).then((balances) => {
          const result = []
          for (let i = 0; i < acos.length; ++i) {
            if (BigInt(balances[i]) > BigInt(0) && defaultAcoCreators().filter((c) => c === acos[i].creator.toLowerCase()).length > 0) {
              result.push({
                aco: acos[i].acoToken,
                expiryTime: acos[i].expiryTime,
                underlying: acos[i].underlying,
                strikeAsset: acos[i].strikeAsset,
                strikePrice: acos[i].strikePrice,
                isCall: acos[i].isCall,
                amount: balances[i]
              })
            }
          }
          this.setState({acoBalances: result})
        })
      })
    } else {
      this.setState({acoBalances: []})
    }
  }

  render() {
    return <div className="farm py-5">
      <div className="farm-title">Auctus Liquidity Incentives</div>
      <div className="farm-subtitle">Earn AUC options for helping grow the protocol fundamentals.</div>
      <a href="https://blog.auctus.org/auctus-auc-first-ever-12-5mm-options-airdrop-incentives-campaign-b9fb96188c5" target="_blank" rel="noopener noreferrer" className="farm-learn-more">Learn more</a>
      <Airdrop {...this.props}/>
      <RewardChart airdropCurrentOption={this.state.airdropCurrentOption} acoBalances={this.state.acoBalances} airdropUnclaimed={this.state.airdropUnclaimed} rewardUnclaimed={this.state.rewardUnclaimed} />
      <LiquidityProgram {...this.props} rewardUnclaimed={this.state.rewardUnclaimed} loadUnclaimedRewards={this.getRewardUnclaimedAcos} toggleRewardUnclaimed={this.state.toggleRewardUnclaimed} />
      {(this.state.acoBalances && this.state.acoBalances.length > 0) && <>
        <div className="unclaimed-rewards-title">
          Claimed Rewards
        </div>
        {this.state.acoBalances && this.state.acoBalances.map(claimed => 
          <RewardOptionCard key={claimed.aco} option={claimed} refresh={this.getAcoBalances} showExercise={true}/>
        )}
      </>}
      {this.state.rewardUnclaimed && this.state.rewardUnclaimed.length > 0 && <>
        <div className="unclaimed-rewards-title">
          Unclaimed Rewards
        </div>
        {this.state.rewardUnclaimed.map(reward => 
          <RewardOptionCard key={reward.aco} option={reward} loadUnclaimedRewards={this.getRewardUnclaimedAcos} showClaim={true}/>
        )}
      </>}
    </div>
  }
}

Farm.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Farm)