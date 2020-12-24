import './Pools.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getAcoPools } from '../util/acoApi'
import Loading from '../partials/Util/Loading'
import PoolDetails from '../partials/Pool/PoolDetails'

class Pools extends Component {
  constructor() {
    super()
    this.state = { pools:[], loading: true }
  }
  
  componentDidMount = () => {
    this.refreshPoolData(false)
  }

  refreshPoolData = (forceRefresh) => {
    getAcoPools(forceRefresh).then(pools => 
      this.setState({pools: pools, loading: false})
    )
  }
  
  render() {
    return <div className="py-4">
        <div className="pools-wrapper">
          <div className="pooled-liquidity">
            <div className="pooled-liquidity-title">Pooled Liquidity</div>
            <div>Become a liquidity provider and receive premiums by automatically selling covered options.</div>
            <div className="alert-message">Pooled liquidity is in beta. Use at your own risk.</div>
          </div>
          <div className="accordion" id="vaultsAccordion">
            {this.state.pools && this.state.pools.map(pool => (
              <PoolDetails key={pool.acoPool} {...this.props} pool={pool} refreshPoolData={this.refreshPoolData}/>
            ))}
          </div>
          {this.state.loading && <Loading></Loading>}
          {!this.state.loading && this.state.pools && this.state.pools.length === 0 && <div className="pooled-liquidity-empty">
            No active pools
          </div>}
        </div>
      </div>
  }
}

Pools.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Pools)