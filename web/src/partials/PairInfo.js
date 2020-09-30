import './PairInfo.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'

class PairInfo extends Component {
  render() {
    var pair = this.props.pair
    var iconUrl = this.context && this.context.assetsImages && this.context.assetsImages[pair.underlyingSymbol]
    var price = this.context.ticker && this.context.ticker[pair.underlyingSymbol]
    return (
      <div className="pair-info">
        <div className="pair-img-symbol">
          {iconUrl && <img src={iconUrl} alt=""></img>}
          <div>
            <div className="pair-symbol">{pair.underlyingSymbol + pair.strikeAssetSymbol}</div>
            <div className="pair-price">{price}</div>
          </div>
        </div>
      </div>)
  }
}
PairInfo.contextTypes = {
  assetsImages: PropTypes.object,
  ticker: PropTypes.object
}
export default PairInfo