import './BuySell.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'

class BuySell extends Component {
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
        
      </div>
  }
}

BuySell.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(BuySell)