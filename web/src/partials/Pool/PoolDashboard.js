import './PoolDashboard.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { formatPercentage, formatWithPrecision, fromDecimals, getBalanceOfAsset } from '../../util/constants'
import { faChevronDown, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import { getAccountPoolPosition } from '../../util/acoPoolMethods'
import BigNumber from 'bignumber.js'
import { getCollateralInfo } from '../../util/acoTokenMethods'
import { ASSETS_INFO } from '../../util/assets'
import { getAcoPoolStatus } from '../../util/acoApi'
import PoolHistoricalChart from './PoolHistoricalChart'
import PoolCurrentTab from './PoolCurrentTab'
import Loading from '../Util/Loading'
import PoolHistoryTxTab from './PoolHistoryTxTab'

class PoolDashboard extends Component {
  constructor(props) {
    super(props)
    this.state = { selectedTab: 1 }
  }

  componentDidMount = () => {
    this.updatePoolStatus()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.match.params.poolAddress != prevProps.match.params.poolAddress) {
      this.updatePoolStatus()
    }
  }

  updatePoolStatus = () => {
    getAcoPoolStatus(this.props.match.params.poolAddress).then(pool => 
      this.setState({pool: pool})
    )
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  getFormattedPoolName = () => {
    var pool = this.state.pool
    return `WRITE ${pool.underlyingInfo.symbol} ${pool.isCall ? "CALL" : "PUT"} OPTIONS`
  }

  selectTab = (selectedTab) => () => {
    this.setState({ selectedTab: selectedTab })
  }

  render() {
    let pool = this.state.pool
    
    return <div className="pool-dashboard">
      {!pool ? <Loading></Loading> :
        <>
          <div className="page-title">
            {this.getFormattedPoolName()}
          </div>
          <div>
            <PoolHistoricalChart pool={pool}></PoolHistoricalChart>
          </div>
          <div className="pool-info-tabs">
            <div className="btn-group pill-button-group">
              <button onClick={this.selectTab(1)} type="button" className={"pill-button " + (this.state.selectedTab === 1 ? "active" : "")}>CURRENT</button>
              <button onClick={this.selectTab(2)} type="button" className={"pill-button " + (this.state.selectedTab === 2 ? "active" : "")}>HISTORY TX</button>
            </div>
            {this.state.selectedTab === 1 && <PoolCurrentTab pool={pool}/>}
            {this.state.selectedTab === 2 && <PoolHistoryTxTab pool={pool}/>}

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