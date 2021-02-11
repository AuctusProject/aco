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

  getUnderlyingAmount = (event) => {
    let pool = this.props.pool
    if (event.type === "swap" && pool.isCall) {
      return -fromDecimals(event.data.collateralLocked, pool.underlyingInfo.decimals)
    }
    if (event.type === "redeem" && pool.isCall) {
      return fromDecimals(event.data.collateralRedeemed, pool.underlyingInfo.decimals)
    }
    if (event.type === "restore") {
      if (pool.isCall) {
        return fromDecimals(event.data.collateralRestored, pool.underlyingInfo.decimals)
      }
      else {
        return -fromDecimals(event.data.amountOut, pool.underlyingInfo.decimals)
      }
    }
    if (event.type === "exercise") {
      if (!pool.isCall) {
        return fromDecimals(event.data.paidAmount, pool.underlyingInfo.decimals)
      }      
    }
    if (event.type === "deposit") {
      if (pool.isCall) {
        return fromDecimals(event.data.collateralDeposited, pool.underlyingInfo.decimals)
      }      
    }
    if (event.type === "withdraw") {
      return fromDecimals(event.data.underlyingWithdrawn, pool.underlyingInfo.decimals)
    }
  }

  getStrikeAmount = (event) => {
    let pool = this.props.pool    
    let collateralInfo = getCollateralInfo(pool)
    if (event.type === "swap") {
      if (pool.isCall) {
        return fromDecimals(event.data.price, pool.strikeAssetInfo.decimals)
      }
      else {
        var amountIn = fromDecimals(event.data.price, pool.strikeAssetInfo.decimals)
        var amountOut = fromDecimals(event.data.collateralLocked, pool.strikeAssetInfo.decimals)
        return <>
          <div>{-amountOut}</div>
          <div>{amountIn}</div>
        </>
      }
    }
    if (event.type === "redeem" && !pool.isCall) {
      return fromDecimals(event.data.collateralRedeemed, collateralInfo.decimals)
    }
    if (event.type === "restore") {
      if (pool.isCall) {
        return -fromDecimals(event.data.amountOut, pool.strikeAssetInfo.decimals)
      }
      else {
        return fromDecimals(event.data.collateralRestored, collateralInfo.decimals)
      }
    }
    if (event.type === "exercise") {
      if (pool.isCall) {
        return fromDecimals(event.data.paidAmount, pool.strikeAssetInfo.decimals)
      }
    }
    if (event.type === "deposit") {
      if (!pool.isCall) {
        return fromDecimals(event.data.collateralDeposited, pool.strikeAssetInfo.decimals)
      }      
    }
    if (event.type === "withdraw") {
      return fromDecimals(event.data.strikeAssetWithdrawn, pool.strikeAssetInfo.decimals)
    }
  }

  getCollateralAmount = (event) => {
    let pool = this.props.pool
    let collateralInfo = getCollateralInfo(pool)
    if (event.type === "swap") {
      return fromDecimals(event.data.collateralLocked, collateralInfo.decimals)
    }
    if (event.type === "exercise") {
      return fromDecimals(event.data.collateralAmount, collateralInfo.decimals)
    }
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
                  <td className="value-highlight">{this.getUnderlyingAmount(event)}</td>
                  <td className="value-highlight">{this.getStrikeAmount(event)}</td>
                  <td className="value-highlight">{this.getCollateralAmount(event)}</td>
                  <td className="value-highlight"><a href={etherscanTxUrl + event.tx} target="_blank" rel="noopener noreferrer">View</a></td>
                </tr>)}
            </tbody>
          </table>}
    </div>)
  }
}
export default PoolHistoryTxTab