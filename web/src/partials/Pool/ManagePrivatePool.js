import './ManagePrivatePool.css'
import React, { Component } from 'react'
import { acoPermissionConfig } from '../../util/acoPoolMethodsv4'
import { formatPercentage, PERCENTAGE_PRECISION } from '../../util/constants'
import Loading from '../Util/Loading'
import UpdateIVModal from './UpdateIVModal'
import UpdateSellingOptionsModal from './UpdateSellingOptionsModal'

class ManagePrivatePool extends Component {
  constructor() {
    super()
    this.state = {  
      loading:true
    }
  }

  componentDidMount = () => {
    let pool = this.props.pool
    acoPermissionConfig(pool.address).then(acoPermissionConfig => this.setConfig(acoPermissionConfig))
  }

  setConfig = (acoPermissionConfig) => {
    this.setState({
      minExpiration: acoPermissionConfig.minExpiration/86400,
      maxExpiration: acoPermissionConfig.maxExpiration/86400,
      tolerancePriceBelowMin: this.getTolerance(acoPermissionConfig.tolerancePriceBelowMin),
      tolerancePriceBelowMax: this.getTolerance(acoPermissionConfig.tolerancePriceBelowMax),
      tolerancePriceAboveMin: this.getTolerance(acoPermissionConfig.tolerancePriceAboveMin),
      tolerancePriceAboveMax: this.getTolerance(acoPermissionConfig.tolerancePriceAboveMax),
      loading:false
    })
  }

  getTolerance = (tolerance) => {
    if (tolerance === "0") {
      return null
    }
    if (tolerance === "1") {
      return 0
    }
    return tolerance/PERCENTAGE_PRECISION
  }

  getStrikePriceConfig = () => {
    if (this.state.tolerancePriceAboveMin === null && this.state.tolerancePriceAboveMax === null && this.state.tolerancePriceBelowMin === null && this.state.tolerancePriceBelowMax === null) {
      return "Any Strike Price"
    }
    else if (((this.state.tolerancePriceAboveMin !== null ? 1 : 0) +
      (this.state.tolerancePriceAboveMax !== null ? 1 : 0) +
      (this.state.tolerancePriceBelowMin !== null ? 1 : 0) +
      (this.state.tolerancePriceBelowMax !== null ? 1 : 0)) > 2
    ) {
      return "Invalid Strike Price Configuration"
    }
    else if (this.state.tolerancePriceBelowMax !== null) {
      if (this.state.tolerancePriceBelowMin !== null) {
        return "Current Price - " + formatPercentage(this.state.tolerancePriceBelowMax, 0) + 
          " <= Strike Price <= Current Price - "+ formatPercentage(this.state.tolerancePriceBelowMin, 0)
      }
      else if (this.state.tolerancePriceAboveMax !== null) {
        return "Current Price - " + formatPercentage(this.state.tolerancePriceBelowMax, 0) + 
          " <= Strike Price <= Current Price + "+ formatPercentage(this.state.tolerancePriceAboveMax, 0)
      }
      else if (this.state.tolerancePriceAboveMin !== null) {
        return "Invalid Strike Price Configuration"
      }
      else {
        return "Strike Price >= Current Price - " + formatPercentage(this.state.tolerancePriceBelowMax, 0)
      }
    }
    else if (this.state.tolerancePriceBelowMin !== null) {
      if (this.state.tolerancePriceAboveMin !== null || this.state.tolerancePriceAboveMax !== null) {
        return "Invalid Strike Price Configuration"
      }
      else {
        return "Strike Price <= Current Price - " + formatPercentage(this.state.tolerancePriceBelowMin, 0)
      }
    }
    else if (this.state.tolerancePriceAboveMin !== null) {
      if (this.state.tolerancePriceAboveMax !== null) {
        return "Current Price + " + formatPercentage(this.state.tolerancePriceAboveMin, 0) + 
          " <= Strike Price <= Current Price + "+ formatPercentage(this.state.tolerancePriceAboveMax, 0)
      }
      else {
        return "Strike Price >= Current Price + " + formatPercentage(this.state.tolerancePriceAboveMin, 0)
      }
    }
    else if (this.state.tolerancePriceAboveMax !== null) {
      return "Strike Price <= Current Price + " + formatPercentage(this.state.tolerancePriceAboveMax, 0)
    }
  }

  getExpirationConfig = () => {
    if (this.state.minExpiration === 0 && this.state.maxExpiration === 0) {
      return "Any Expiration"
    }
    else if (this.state.maxExpiration === 0) {
      return `Current Date + ${this.state.minExpiration} < Expiration Date`
    }
    else if (this.state.minExpiration === 0) {
      return `Expiration Date < Current Date + ${this.state.maxExpiration} days`
    }
    return `Current Date + ${this.state.minExpiration} days < Expiration Date < Current Date + ${this.state.maxExpiration} days`
  }

  onUpdateIVClick = () => {
    this.setState({showUpdateIVModal: true})
  }

  onHideUpdateIVModal = (refresh) => {
    if (refresh) {
      this.props.refresh()
    }
    this.setState({showUpdateIVModal: false})
  }

  onUpdateSellingOptionsClick = () => {
    this.setState({showUpdateSellingOptionsModal: true})
  }

  onHideUpdateSellingOptionsModal = (refresh) => {
    if (refresh) {
      this.componentDidMount()
    }
    this.setState({showUpdateSellingOptionsModal: false})
  }

  render() {
    let pool = this.props.pool
    return this.state.loading ? <Loading/> :
    <div className="manage-private-pool">
      <div className="manage-private-pool-title">Manage Private Pool</div>
      <div className="manage-private-pool-item">
        <div className="manage-private-pool-item-label">Current IV:</div>
        <div className="manage-private-pool-item-value">{pool.volatility}%</div>
        <div className="aco-button action-btn btn-sm" onClick={this.onUpdateIVClick}>Update</div>
      </div>
      <div className="manage-private-pool-item">
        <div className="manage-private-pool-item-label">Selling options:</div>
        <div className="manage-private-pool-item-value">
          <div>{this.getStrikePriceConfig()}</div>
          <div>{this.getExpirationConfig()}</div>
        </div>
        <div className="aco-button action-btn btn-sm" onClick={this.onUpdateSellingOptionsClick}>Update</div>
      </div>
      {this.state.showUpdateIVModal && <UpdateIVModal onHide={this.onHideUpdateIVModal} pool={pool}/>}
      {this.state.showUpdateSellingOptionsModal && <UpdateSellingOptionsModal 
        onHide={this.onHideUpdateSellingOptionsModal} 
        pool={pool} 
        minExpiration={this.state.minExpiration} 
        maxExpiration={this.state.maxExpiration} 
        tolerancePriceAboveMin={this.state.tolerancePriceAboveMin} 
        tolerancePriceAboveMax={this.state.tolerancePriceAboveMax}
        tolerancePriceBelowMin={this.state.tolerancePriceBelowMin}
        tolerancePriceBelowMax={this.state.tolerancePriceBelowMax}/>}
    </div>
  }
}

export default ManagePrivatePool