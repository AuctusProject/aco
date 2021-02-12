import './ManagePrivatePool.css'
import React, { Component } from 'react'
import { maxExpiration, minExpiration, tolerancePriceAbove, tolerancePriceBelow } from '../../util/acoPoolMethods'
import { formatPercentage, percentagePrecision } from '../../util/constants'
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
    let promises = []
    promises.push(minExpiration(pool.address).then(minExpiration => this.setState({minExpiration: minExpiration/86400})))
    promises.push(maxExpiration(pool.address).then(maxExpiration => this.setState({maxExpiration: maxExpiration/86400})))
    promises.push(tolerancePriceAbove(pool.address).then(tolerancePriceAbove => this.setState({tolerancePriceAbove: tolerancePriceAbove/percentagePrecision})))
    promises.push(tolerancePriceBelow(pool.address).then(tolerancePriceBelow => this.setState({tolerancePriceBelow: tolerancePriceBelow/percentagePrecision})))

    Promise.all(promises).then(() => {this.setState({loading:false})})
  }

  getStrikePriceConfig = () => {
    if (this.state.tolerancePriceAbove === 0 && this.state.tolerancePriceBelow === 0) {
      return "Any Strike Price"
    }
    else if (this.state.tolerancePriceBelow === 0) {
      return "Strike Price > Current Price + "+ formatPercentage(this.state.tolerancePriceAbove, 0)
    }
    else if (this.state.tolerancePriceAbove === 0) {
      return "Strike Price < Current Price - "+ formatPercentage(this.state.tolerancePriceBelow, 0)
    }
    return "Current Price - "+formatPercentage(this.state.tolerancePriceBelow, 0)+" <= Strike Price <= Current Price + "+ formatPercentage(this.state.tolerancePriceAbove, 0)
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
      {this.state.showUpdateSellingOptionsModal && <UpdateSellingOptionsModal onHide={this.onHideUpdateSellingOptionsModal} pool={pool} minExpiration={this.state.minExpiration} maxExpiration={this.state.maxExpiration} tolerancePriceAbove={this.state.tolerancePriceAbove} tolerancePriceBelow={this.state.tolerancePriceBelow}/>}
    </div>
  }
}

export default ManagePrivatePool