import './PairInfo.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { ASSETS_INFO } from '../util/assets'
import { getBinanceSymbolForPair } from '../util/constants'

class PairInfo extends Component {
  render() {
    var pair = this.props.pair
    var iconUrl = ASSETS_INFO[pair.underlyingSymbol] ? ASSETS_INFO[pair.underlyingSymbol].icon : null
    var pairSymbol = getBinanceSymbolForPair(pair)
    var price = this.context.ticker && this.context.ticker.data[pairSymbol] && this.context.ticker.data[pairSymbol].currentClosePrice
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
  ticker: PropTypes.object
}
export default PairInfo