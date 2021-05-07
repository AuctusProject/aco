import './Orderbook.css'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'

class Orderbook extends Component {
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
        {this.context && this.context.orders ? "Orders" : "vazio"}
      </div>
  }
}

Orderbook.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object,
  orders: PropTypes.object,
}
export default withRouter(Orderbook)