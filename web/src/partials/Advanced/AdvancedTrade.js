import './AdvancedTrade.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import BuySell from './BuySell'
import Orderbook from './Orderbook'
import OpenOrders from './OpenOrders'
import WebsocketOrderProvider from '../../util/Zrx/WebsocketOrderProvider'

class AdvancedTrade extends Component {
  constructor() {
    super()
    this.state = {}
  }
  
  componentDidUpdate = (prevProps) => {
  }

  componentDidMount = () => {
  }
  
  render() {
    return <div>
      <WebsocketOrderProvider 
        makerToken={"0x57ab1ec28d129707052df4df418d58a2d46d5f51"}
        takerToken={"0x56bc8fa2b2b48d7a9427f21565265c29a31a8bd4"}>
        <BuySell {...this.props}></BuySell>
        <Orderbook {...this.props}></Orderbook>
        <OpenOrders {...this.props}></OpenOrders>
      </WebsocketOrderProvider>
      </div>
  }
}

AdvancedTrade.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object,
}
export default withRouter(AdvancedTrade)