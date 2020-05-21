import PropTypes from 'prop-types'
import { Component } from 'react'
import { getBinanceSymbolForPair } from './constants'

const checkWsInterval = 5000

const childContextTypes = {
  ticker: PropTypes.shape({
    data: PropTypes.object
  })
}

class ApiTickerProvider extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = {socketData: {}}
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.pairs !== prevProps.pairs) {
      this.refreshWs()
    }
  }

  getChildContext() {
    return {
      ticker: {
        data: this.state.socketData
      }
    }
  }

  refreshWs = () => {
    if (this.state.ws && this.state.ws.readyState !== WebSocket.CLOSED) {
      this.state.ws.close()
    } else if (!this.state.ws) {
      this.connectWs()
    }
  }

  connectWs = () => {
    if (this.state.ws && this.state.ws.readyState !== WebSocket.CLOSED) {
      this.state.ws.close()
    } else if (this.props.pairs) {
      let symbolData = {}
      var wsQuery = ""
      for (let i = 0; i < this.props.pairs.length; i++) {
        var symbol = getBinanceSymbolForPair(this.props.pairs[i]) + "@ticker"
        symbolData[symbol] = getBinanceSymbolForPair(this.props.pairs[i])
        wsQuery += "/" + symbol 
      }
      if (wsQuery) {
        var ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=" + wsQuery.substring(1))
        let self = this
        ws.onopen = () => {
          console.log("connected to Binance websocket")
          self.setState({ws: ws, checkWsFunction: setTimeout(() => self.checkWs(), checkWsInterval)})
        }
        ws.onclose = (e) => {
          console.log("Binance websocket closed")
          if (self.state.checkWsFunction) clearTimeout(self.state.checkWsFunction)
          self.setState({ws: null, checkWsFunction: null}, () => self.checkWs())
        }
        ws.onerror = (err) => {
          console.error("Binance websocket error: ", err.message)
          ws.close()
        }
        ws.onmessage = (messageEvent) => {
          self.setBinanceTickerWebSocketPayload(messageEvent.data, symbolData)
        }
      }
    } else {
      this.setState({checkWsFunction: setTimeout(() => this.checkWs(), checkWsInterval)})
    }
  }

  checkWs = () => {
    if (!this.state.ws || this.state.ws.readyState === WebSocket.CLOSED) this.connectWs()
    else this.setState({checkWsFunction: setTimeout(() => this.checkWs(), checkWsInterval)})
  }

  setBinanceTickerWebSocketPayload = (data, symbolData) => {
    if (data) {
      let payload = {}
      let assetId = null
      var socketData = this.state.socketData
      JSON.parse(data, (p, v) =>
      {
        if (p === "stream") {
          assetId = symbolData[v]
        } else if (p === "e") {
          payload.eventType = v
        } else if (p === "E") {
          payload.eventTime = new Date(v)
        } else if (p === "s") {
          payload.pair = v
        } else if (p === "p") {
          payload.priceChange = parseFloat(v)
        } else if (p === "P") {
          payload.priceChangePercentage = parseFloat(v)
        } else if (p === "w") {
          payload.weightedAveragePrice = parseFloat(v)   
        } else if (p === "x") {
          payload.previousDayClosePrice = parseFloat(v)   
        } else if (p === "c") {
          payload.currentClosePrice = parseFloat(v)   
        } else if (p === "Q") {
          payload.closeTradeQty = parseFloat(v)   
        } else if (p === "b") {
          payload.bestBidPrice = parseFloat(v)    
        } else if (p === "B") {
          payload.bestBidQty = parseFloat(v) 
        } else if (p === "a") {
          payload.bestAskPrice = parseFloat(v)   
        } else if (p === "A") {
          payload.bestAskQty = parseFloat(v)    
        } else if (p === "o") {
          payload.openPrice = parseFloat(v)   
        } else if (p === "h") {
          payload.highPrice = parseFloat(v)    
        } else if (p === "l") {
          payload.lowPrice = parseFloat(v) 
        } else if (p === "v") {
          payload.totalVolumeBaseAsset = parseFloat(v)
        } else if (p === "q") {
          payload.totalVolumeQuoteAsset = parseFloat(v)  
        } else if (p === "O") {
          payload.statOpenTime = v  
        } else if (p === "C") {
          payload.statCloseTime = v    
        } else if (p === "F") {
          payload.firstTradeId = v  
        } else if (p === "L") {
          payload.lastTradeId = v 
        } else if (p === "n") {
          payload.totalTrades = v 
        } else if (p === "data") {
          socketData[assetId] = payload
          payload = {}
          assetId = null
        }
      })
      this.setState({socketData: socketData})
    }
  }

  render() {
    return this.props.children
  }
}

ApiTickerProvider.childContextTypes = childContextTypes
export default ApiTickerProvider