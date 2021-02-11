import './PoolHistoricalChart.css'
import React, { Component } from 'react'
import PerShareChart from './PerShareChart'

class PoolHistoricalChart extends Component {
  constructor() {
    super()
    this.state = {  
    }
  }  

  render() {
    return (
    <div className="pool-historical-chart-wrapper">
      {!!this.props.pool ? 
        <PerShareChart pool={this.props.pool.address} isUnderlyingValue={false} underlyingInfo={this.props.pool.underlyingInfo} strikeAssetInfo={this.props.pool.strikeAssetInfo} /> 
        : 
        <div></div>}
    </div>)
  }
}
export default PoolHistoricalChart