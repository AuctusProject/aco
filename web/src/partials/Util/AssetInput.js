import './AssetInput.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getAcoAssets } from '../../util/acoApi'
import Modal from 'react-bootstrap/Modal'

class AssetInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedAsset: null,
      showModal: false,
      filter: "",
      assets: [],
      filteredAssets: []
    }
  }

  componentDidMount = () => {
    getAcoAssets().then(assets => {
      var filteredAssets = this.filterAssets(assets)
      this.setState({assets:assets, filteredAssets: filteredAssets})
    })
    this.setState({selectedAsset: this.props.selectedAsset})
  }

  filterAssets = (assets) => {
    var filter = this.state.filter ? this.state.filter.toLowerCase() : ""
    return assets.filter(a => 
      (this.isNullOrEmpty(filter) || 
      a.symbol.toLowerCase().includes(filter) || 
      a.address.toLowerCase() === filter)
    )
  }

  isNullOrEmpty = (value) => {
    return value === null || value === ""
  }

  onHideModal = () => {
    this.setState({showModal:false})
  }

  onShowModal = () => {
    this.setState({showModal:true})
  }

  onFilterChange = (e) => {
    this.setState({filter: e.target.value}, () => {
      var filteredAssets = this.filterAssets(this.state.assets)      
      this.setState({filteredAssets: filteredAssets})
    })
  }

  onAssetSelect = (asset) => () => {
    this.setState({selectedAsset: asset, showModal:false})
    this.props.onAssetSelected(asset)
  }

  getAssetIcon = (asset) => {
    var iconUrl = this.context && this.context.assetsImages && this.context.assetsImages[asset.symbol]
    return <img src={iconUrl}></img>
  }

  render() {
    return (
      <div className="asset-input">
        <div className="" onClick={this.onShowModal}>
          {this.state.selectedAsset ? 
            <div className="selected-asset">
              {this.getAssetIcon(this.state.selectedAsset)}
              {this.state.selectedAsset.symbol}
            </div> : 
            <div>Select a token</div>
          }
        </div>
        <Modal className="asset-input-modal" centered={true} size="sm" show={this.state.showModal} onHide={this.onHideModal}>
          <Modal.Header closeButton>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                Select a token
              </div>
              <div className="col-md-12">
                <div className="search-input-wrapper">
                  <input onChange={this.onFilterChange} value={this.state.filter} placeholder="Search symbol or paste address"></input>
                  <FontAwesomeIcon icon={faSearch}/>
                </div>
              </div>
              <div className="col-md-12">
                <div>Token Name</div>
              </div>
              {this.state.filteredAssets.map(asset => (
                <div className="col-md-12 asset-option" onClick={this.onAssetSelect(asset)}>
                  {this.getAssetIcon(asset)}
                  {asset.symbol}
                </div>
              ))}
            </div>
          </Modal.Body>
        </Modal>
      </div>
    )
  }
}
AssetInput.contextTypes = {
  assetsImages: PropTypes.object
}
export default withRouter(AssetInput)