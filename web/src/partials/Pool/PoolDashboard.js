import './PoolDashboard.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import PoolHistoricalChart from './PoolHistoricalChart'
import PoolCurrentTab from './PoolCurrentTab'
import Loading from '../Util/Loading'
import PoolHistoryTxTab from './PoolHistoryTxTab'
import ManagePrivatePool from './ManagePrivatePool'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { getPool } from '../../util/dataController'
import { menuConfig } from '../../util/network'

class PoolDashboard extends Component {
  constructor(props) {
    super(props)
    this.state = { selectedTab: 1 }
  }

  componentDidMount = () => {
    this.updatePoolStatus()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.match.params.poolAddress !== prevProps.match.params.poolAddress) {
      this.updatePoolStatus()
    }
  }

  updatePoolStatus = () => {
    getPool(this.props.match.params.poolAddress).then(pool => {
      if (pool) {
        this.setState({pool: pool})
      }
      else {
        this.goToPools()
      }
    })
  }

  isAdmin = () => {
    return this.state.pool && this.isConnected() && this.state.pool.admin && this.state.pool.admin.toLowerCase() === this.context.web3.selectedAccount.toLowerCase()
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  getFormattedPoolName = () => {
    var pool = this.state.pool
    return `WRITE ${pool.underlyingInfo.symbol} ${pool.isCall ? "CALL" : "PUT"} OPTIONS${pool.isPrivate ? (" #" + pool.poolId) : ""}`
  }

  selectTab = (selectedTab) => () => {
    this.setState({ selectedTab: selectedTab })
  }

  goToPools = () => {
    this.props.history.push("/pools")
  }

  render() {
    let pool = this.state.pool
    var menuConfigData = menuConfig()
    return <div className="pool-dashboard">
      {!pool ? <Loading></Loading> :
        <>
          <div className="page-title">
            <div className="back-link clickable" onClick={this.goToPools}><FontAwesomeIcon icon={faArrowLeft}/> Pools</div>
            {this.getFormattedPoolName()}
          </div>
          {<div>
            <PoolHistoricalChart {...this.props} pool={pool}></PoolHistoricalChart>
          </div>}
          {this.isAdmin() && <div>
            <ManagePrivatePool {...this.props} pool={pool} refresh={this.updatePoolStatus}/>
          </div>}
          <div className="pool-info-tabs">
            {menuConfigData.hasPoolHistory && <div className="btn-group pill-button-group">
              <button onClick={this.selectTab(1)} type="button" className={"pill-button " + (this.state.selectedTab === 1 ? "active" : "")}>CURRENT</button>
              <button onClick={this.selectTab(2)} type="button" className={"pill-button " + (this.state.selectedTab === 2 ? "active" : "")}>HISTORY TX</button>
            </div>}
            {(!menuConfigData.hasPoolHistory || this.state.selectedTab === 1) && <PoolCurrentTab {...this.props} isAdmin={this.isAdmin()} pool={pool} refresh={this.updatePoolStatus}/>}
            {menuConfigData.hasPoolHistory && this.state.selectedTab === 2 && <PoolHistoryTxTab {...this.props} pool={pool}/>}

          </div>
        </>
      }

    </div>
  }
}

PoolDashboard.contextTypes = {
  assetsImages: PropTypes.object,
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(PoolDashboard)