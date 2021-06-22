import PropTypes from 'prop-types'
import { Component } from 'react'
import { getCoingeckoPrice } from './coingeckoApi'
import { getAcoAssets } from './acoApi'

let coingeckoTimeout = null
const checkTimeout = 20000
const childContextTypes = {
  assetsImages: PropTypes.object,
  ticker: PropTypes.object
}

class ApiCoingeckoDataProvider extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = {priceData: {}}
  }

  componentDidMount = () => {
    getAcoAssets().then(assets => {
      this.setState({assets: assets, assetsImages: this.formatAssetImages(assets)}, () => {
        this.internalCoingeckoPriceMonitor()
      })
    })
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      clearTimeout(coingeckoTimeout)
      this.componentDidMount()
    }
  }

  formatAssetImages = (assets) => {
    var assetImages = {}
    assets.forEach(element  => {
      if (element.imageUrl) {
        assetImages[element.symbol] = element.imageUrl
      }
    })
    return assetImages
  }
  
  startCoingeckoPriceMonitor = () => {
    coingeckoTimeout = setTimeout(this.internalCoingeckoPriceMonitor, checkTimeout)
  }

  internalCoingeckoPriceMonitor = () => {
    getCoingeckoPrice(this.state.assets.map(a => a.coingeckoId).join(","))
    .then(data => {
      this.setState({priceData: this.formatPriceData(data)})
    })
    .finally(
      () => this.startCoingeckoPriceMonitor()
    )
  }

  formatPriceData = (data) => {
    var priceData = {}
    this.state.assets.forEach(element  => {
      if (data[element.coingeckoId] && data[element.coingeckoId].usd) {
        priceData[element.symbol] = data[element.coingeckoId].usd
      }
    })
    return priceData
  }

  getChildContext() {
    return {
      assetsImages: this.state.assetsImages,
      ticker: this.state.priceData
    }
  }

  render() {
    return this.props.children
  }
}

ApiCoingeckoDataProvider.childContextTypes = childContextTypes
export default ApiCoingeckoDataProvider