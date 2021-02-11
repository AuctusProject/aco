import './PoolHistoricalChart.css'
import React, { Component } from 'react'
import PerShareChart from './PerShareChart'
import SimpleDropdown from '../SimpleDropdown'

class PoolHistoricalChart extends Component {
  constructor() {
    super()
    this.state = {  
      isUnderlyingValue: false,
      lastPerShare: null
    }
  }  

  onReferenceChange = (option) => {
    this.setState({isUnderlyingValue: (option && this.props.pool.underlyingInfo.symbol === option.value)})
  }

  onLastPerShareChange = (share) => {
    const numberFormat = new Intl.NumberFormat((navigator.language || navigator.languages[0] || 'en'))
    this.setState({lastPerShare: (share ? numberFormat.format(share) : null)})
  }

  render() {
    const references = [{value:this.props.pool.strikeAssetInfo.symbol,name:this.props.pool.strikeAssetInfo.symbol},{value:this.props.pool.underlyingInfo.symbol,name:this.props.pool.underlyingInfo.symbol}]
    return (
      <div className="pool-historical-container">
      {!!this.props.pool && 
        <div className="pool-historical-chart-wrapper">
          <div className="pool-historical-chart-top">
            <div className="pool-historical-chart-title">
              <div>PERFORMANCE</div>
              <div className="input-column strike-column">
                <div className="input-field">
                  <SimpleDropdown placeholder="Reference" selectedOption={(this.state.isUnderlyingValue ? references[1] : references[0])} options={references} onSelectOption={this.onReferenceChange}></SimpleDropdown>
                </div>
              </div>
            </div>
            {this.state.lastPerShare &&
            <div className="pool-historical-chart-share">
              1 SHARE =&nbsp;
              <div>{this.state.lastPerShare}</div>
              &nbsp;{(this.state.isUnderlyingValue ? references[1].value : references[0].value)}
            </div>}
          </div>
          <PerShareChart pool={this.props.pool.address} isUnderlyingValue={this.state.isUnderlyingValue} underlyingInfo={this.props.pool.underlyingInfo} strikeAssetInfo={this.props.pool.strikeAssetInfo} setLastPerShare={this.onLastPerShareChange}></PerShareChart> 
        </div>}
    </div>)
  }
}
export default PoolHistoricalChart