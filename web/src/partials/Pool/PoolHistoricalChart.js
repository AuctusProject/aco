import './PoolHistoricalChart.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PerShareChart from './PerShareChart'
import SimpleDropdown from '../SimpleDropdown'
import { fromDecimals } from '../../util/constants'

class PoolHistoricalChart extends Component {
  constructor() {
    super()
    this.state = {  
      isUnderlyingValue: false,
      lastPerShare: null
    }
  } 
  
  componentDidMount() {
    this.setState({lastPerShare: this.getLastPerShare(this.state.isUnderlyingValue)})
  }

  componentDidUpdate(prevProps) {
    if ((!prevProps.pool && this.props.pool) 
    || (prevProps.pool && !this.props.pool)
    || (prevProps.pool.address !== this.props.pool.address)) {
      this.setState({lastPerShare: this.getLastPerShare(this.state.isUnderlyingValue)})
    }
  }

  getLastPerShare(isUnderlyingValue) {
    if (this.props.pool) {
      let underlying = parseFloat(fromDecimals(this.props.pool.underlyingPerShare, this.props.pool.underlyingInfo.decimals, 4, 0))
      let strikeAsset = parseFloat(fromDecimals(this.props.pool.strikeAssetPerShare, this.props.pool.strikeAssetInfo.decimals, 4, 0))  
      let price = this.getUnderlyingPrice()
      if (isUnderlyingValue) {
        return Math.round(10000 * (underlying + strikeAsset / price)) / 10000
      } else {
        return Math.round(10000 * (strikeAsset + underlying * price)) / 10000
      }
    } else {
      return null
    }
  }

  getUnderlyingPrice() {
    let underlyingPrice = this.context.ticker && this.context.ticker[this.props.pool.underlyingInfo.symbol]
    if (!underlyingPrice) {
      underlyingPrice = 0
    }
    return underlyingPrice
  }

  onReferenceChange = (option) => {
    let isUnderlyingValue = (option && this.props.pool.underlyingInfo.symbol === option.value)
    let lastPerShare = this.getLastPerShare(isUnderlyingValue)
    this.setState({isUnderlyingValue: isUnderlyingValue, lastPerShare: lastPerShare})
  }

  getLastPerShareFormatted = () => {
    let numberFormat = new Intl.NumberFormat((navigator.language || navigator.languages[0] || 'en'))
    return numberFormat.format(this.state.lastPerShare)
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
              <div>{this.getLastPerShareFormatted()}</div>
              &nbsp;{(this.state.isUnderlyingValue ? references[1].value : references[0].value)}
            </div>}
          </div>
          <PerShareChart currentValue={this.state.lastPerShare} pool={this.props.pool.address} isUnderlyingValue={this.state.isUnderlyingValue} underlyingInfo={this.props.pool.underlyingInfo} strikeAssetInfo={this.props.pool.strikeAssetInfo}></PerShareChart> 
        </div>}
    </div>)
  }
}
PoolHistoricalChart.contextTypes = {
  ticker: PropTypes.object
}
export default PoolHistoricalChart