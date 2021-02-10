import './PoolCurrentTab.css'
import React, { Component } from 'react'

class PoolCurrentTab extends Component {
  constructor() {
    super()
    this.state = {  
    }
  }  

  componentDidMount = () => {    
  }

  componentDidUpdate = (prevProps) => {    
  }

  render() {
    return (
    <div className="pool-current-tab">
      <div className="pool-current-itens-row">
        <div className="pool-current-item">
          <div className="pool-current-item-label">Total net value</div>
          <div className="pool-current-item-value">{this.props.pool.openPositionNetValue}</div>
        </div>
        <div className="pool-current-item">
          <div className="pool-current-item-label">Supply</div>
          <div className="pool-current-item-value">{this.props.pool.totalSupply}</div>
        </div>
        <div className="pool-current-item">
          <div className="pool-current-item-label">Value per share</div>
          <div className="pool-current-item-value">0</div>
        </div>
        <div className="pool-current-item">
          <div className="pool-current-item-label">Liquidity available</div>
          <div className="pool-current-item-value">0</div>
        </div>
        <div className="pool-current-item">
          <div className="pool-current-item-label">Open positions</div>
          <div className="pool-current-item-value">0</div>
        </div>
        <div className="pool-current-item">
          <div className="pool-current-item-label">Utilization rate</div>
          <div className="pool-current-item-value">0</div>
        </div>
      </div>
    </div>)
  }
}
export default PoolCurrentTab