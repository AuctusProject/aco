import './Pools.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Loading from '../partials/Util/Loading'
import PoolDetails from '../partials/Pool/PoolDetails'
import DiscontinuedPoolDetails from '../partials/Pool/DiscontinuedPoolDetails'
import { defaultPoolAdmin, deprecatedPoolImplementation } from '../util/constants'
import { getPools } from '../util/dataController'
import CreatePoolModal from '../partials/Pool/CreatePoolModal'

class Pools extends Component {
  constructor() {
    super()
    this.state = { pools:[], loading: true, createPool: false}
  }
  
  componentDidMount = () => {
    this.refreshPoolData()
  }

  getCurrentAccount = () => {
    return (this.context && this.context.web3 && this.context.web3.selectedAccount) ? this.context.web3.selectedAccount.toLowerCase() : null
  }

  refreshPoolData = (forceRefresh) => {
    getPools(forceRefresh).then(pools => {
      var discontinuedPools = pools.filter(p => deprecatedPoolImplementation.filter(c => c.toLowerCase() === p.acoPoolImplementation.toLowerCase()).length > 0)
      var availablePools = pools.filter(p => deprecatedPoolImplementation.filter(c => c.toLowerCase() === p.acoPoolImplementation.toLowerCase()).length === 0 && 
        (p.admin === null || p.admin === undefined || p.admin.toLowerCase() === defaultPoolAdmin.toLowerCase() || p.admin.toLowerCase() === this.getCurrentAccount())
      )
      this.setState({pools: availablePools, discontinuedPools: discontinuedPools, loading: false})
    })
  }

  onCreatePoolClick = () => {
    this.setState({createPool:true})
  }

  onCreatePoolHide = (completed) => {
    this.setState({ createPool: false, loading: true })
    if (completed) {
      this.refreshPoolData(true)
    }    
  }
  
  render() {
    return <div className="py-4">
        <div className="pools-wrapper">
          <div className="pooled-liquidity">
            <div className="pooled-liquidity-title-row">
              <div className="pooled-liquidity-title">Pooled Liquidity</div>
              <div className="create-pool-btn outline-btn" onClick={this.onCreatePoolClick}>
                <div>CREATE POOL</div>
              </div>
            </div>
            <div>Become a liquidity provider and receive premiums by automatically selling covered options.</div>
            <div className="alert-message">Pooled liquidity is in beta. Use at your own risk.</div>
          </div>
          <div className="accordion" id="vaultsAccordion">
            {this.state.discontinuedPools && this.state.discontinuedPools.map(pool => (
              <DiscontinuedPoolDetails key={pool.acoPool} {...this.props} pool={pool} refreshPoolData={this.refreshPoolData}/>
            ))}
            {this.state.pools && this.state.pools.map(pool => (
              <PoolDetails key={pool.acoPool} {...this.props} pool={pool} refreshPoolData={this.refreshPoolData}/>
            ))}
          </div>
          {this.state.loading && <Loading></Loading>}
          {!this.state.loading && this.state.pools && this.state.pools.length === 0 && <div className="pooled-liquidity-empty">
            No active pools
          </div>}
        </div>
        {this.state.createPool && <CreatePoolModal {...this.props} onHide={this.onCreatePoolHide} />}
      </div>
  }
}

Pools.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Pools)