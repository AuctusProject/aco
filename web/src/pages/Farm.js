import './Farm.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Airdrop from '../partials/Farm/Airdrop'
import LiquidityProgram from '../partials/Farm/LiquidityProgram'
import { claimed, getAcosAmount, getClaimableAcos, listClaimedAcos } from '../util/acoDistributorMethods'
import { listClaimedRewards, listUnclaimedRewards } from '../util/acoRewardsMethods'
import { getClaimableAco } from '../util/acoApi'
import RewardChart from '../partials/Farm/RewardChart'


class Farm extends Component {
  constructor() {
    super()
    this.state = { loading: true, airdropUnclaimed: null, toggleRewardUnclaimed: false }
  }

  componentDidMount = () => {
    this.loadData()
  }

  componentDidUpdate = (prevProps) => {    
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.loadData()
    }    
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  loadData = () => {
    this.getAirdropClaimedAcos()
    this.getAirdropClaimableData()
    this.getRewardClaimedAcos()
    this.getRewardUnclaimedAcos()
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

  getAirdropClaimableData = () => {
    const baseAmount = "1000000000000000000000"
    if (this.isConnected()) {
      getClaimableAco(this.context.web3.selectedAccount).then((claimable) => {
        if (claimable && claimable.length) {
          const prom = []
          for (let i = 0; i < claimable.length; ++i) {
            prom.push(claimed(claimable[i].id))
          }
          Promise.all(prom).then((res) => {
            var toClaim = {}
            for (let j = 0; j < res.length; ++j) {
              if (!res[j]) {
                toClaim = claimable[j]
              }
            }
            this.setState({airdropUnclaimed: toClaim}, () => this.getAirdropClaimableAcos(toClaim.amount || baseAmount))
          })
        } else {
          this.setState({airdropUnclaimed: {}}, () => this.getAirdropClaimableAcos(baseAmount))
        }
      })
    } else {
      this.setState({airdropUnclaimed: null}, () => this.getAirdropClaimableAcos(baseAmount))
    }
  }

  getAirdropClaimableAcos = (amount) => {
    Promise.all([getClaimableAcos(amount), getAcosAmount()]).then((data) => {
      var airdropCurrentOption = data && data[0] && data[0][0] ? data[0][0] : null
      var airdropNextOption = data && data[0] && data[0][1] ? data[0][1] : null
      var available = airdropCurrentOption && data[1] ? data[1].filter((c) => c.aco.toLowerCase() === airdropCurrentOption.aco.toLowerCase()) : []
      if (available.length) {
        airdropCurrentOption.available = available[0].amount
      } else if (airdropCurrentOption) {
        airdropCurrentOption.available = "0"
      }
      this.setState({
        airdropCurrentOption: airdropCurrentOption,
        airdropNextOption: airdropNextOption,
        airdropAcosAvailable: data[1]
      })
    })
  }

  render() {
    return <div className="farm py-5">
      <div className="farm-title">Auctus Liquidity Incentives</div>
      <div className="farm-subtitle">Earn AUC options for helping grow the protocol fundamentals.</div>
      <a href="TODO" target="_blank" rel="noopener noreferrer" className="farm-learn-more">Learn more</a>
      <Airdrop airdropUnclaimed={this.state.airdropUnclaimed} acosAvailable={this.state.airdropAcosAvailable} currentOption={this.state.airdropCurrentOption} nextOption={this.state.airdropNextOption} {...this.props}/>
      <LiquidityProgram {...this.props} rewardUnclaimed={this.state.rewardUnclaimed} loadUnclaimedRewards={this.getRewardUnclaimedAcos} toggleRewardUnclaimed={this.state.toggleRewardUnclaimed} />
      <RewardChart airdropCurrentOption={this.state.airdropCurrentOption} airdropClaimed={this.state.airdropClaimed} airdropUnclaimed={this.state.airdropUnclaimed} rewardClaimed={this.state.rewardClaimed} rewardUnclaimed={this.state.rewardUnclaimed} />
    </div>
  }
}

Farm.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Farm)