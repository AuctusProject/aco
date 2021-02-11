import './PoolHistoryTxTab.css'
import React, { Component } from 'react'
import { getAcoPoolEvents } from '../../util/acoApi'
import { getCollateralInfo } from '../../util/acoTokenMethods'
import { etherscanTxUrl, fromDecimals } from '../../util/constants'
import Loading from '../Util/Loading'

class PoolHistoryTxTab extends Component {
  constructor() {
    super()
    this.state = {  
    }
  }  

  componentDidMount = () => {   
    getAcoPoolEvents(this.props.pool.address).then(events => this.setState({events:events}))
  }

  componentDidUpdate = (prevProps) => {    
  }

  render() {
    let pool = this.props.pool
    let collateralInfo = getCollateralInfo(pool)
    return (
        <div className="pool-history-tx-tab">
          {!this.state.events ? <Loading/> :
          <table className="aco-table mx-auto table-responsive-md">
            <thead>
              <tr>
                <th rowSpan="2">Action</th>
                <th rowSpan="2" className="value-highlight">Option</th>
                <th rowSpan="2" className="value-highlight">Qty</th>
                <th colSpan="2" className="value-highlight liquidity-head pt-1">Liquidity Available</th>
                <th rowSpan="2" className="value-highlight">Collateral {collateralInfo.symbol}</th>
                <th rowSpan="2" className="value-highlight">Tx</th>
              </tr>
              <tr>
                <th className="value-highlight liquidity-head pb-1">{pool.underlyingInfo.symbol}</th>
                <th className="value-highlight liquidity-head pb-1">{pool.strikeAssetInfo.symbol}</th>
              </tr>
            </thead>
            <tbody>
              {this.state.events && this.state.events.map(event => 
                <tr key={event.tx}>
                  <td>{event.type}</td>
                  <td className="value-highlight">{event.data.acoName}</td>
                  <td className="value-highlight">{fromDecimals(event.data.tokenAmount, pool.underlyingInfo.decimals, 4, 0)}</td>
                  <td className="value-highlight"></td>
                  <td className="value-highlight"></td>
                  <td className="value-highlight"></td>
                  <td className="value-highlight"><a href={etherscanTxUrl + event.tx} target="_blank" rel="noopener noreferrer">View</a></td>
                </tr>)}
            </tbody>
          </table>}
    </div>)
  }
}
export default PoolHistoryTxTab