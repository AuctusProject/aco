import './Farm.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Airdrop from '../partials/Farm/Airdrop'
import LiquidityProgram from '../partials/Farm/LiquidityProgram'


class Farm extends Component {
  constructor() {
    super()
    this.state = { loading: true }
  }

  componentDidMount = () => {
  }

  render() {
    return <div className="farm py-5">
      <div className="farm-title">Auctus Liquidity Incentives</div>
      <div className="farm-subtitle">Earn AUC options for helping grow the protocol fundamentals.</div>
      <a href="TODO" target="_blank" rel="noopener noreferrer" className="farm-learn-more">Learn more</a>
      <Airdrop {...this.props}/>
      <LiquidityProgram  {...this.props}/>
    </div>
  }
}

Farm.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Farm)