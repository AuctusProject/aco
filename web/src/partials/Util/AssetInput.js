import './AssetInput.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { getAcoAssets } from '../../util/acoApi'
import Modal from 'react-bootstrap/Modal'
import ReactTooltip from 'react-tooltip'
import { getByAddress } from '../../util/constants'
import TokenImportedModal from './TokenImportedModal'

class AssetInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedAsset: null,
      showModal: false,
      showTokenImportedModal: false,
      filter: "",
      assets: [],
      filteredAssets: []
    }
  }

  componentDidMount = () => {
    if (!this.props.disabled) {
      getAcoAssets().then(assets => {
        this.filterAssets(assets)
      })
    }
    this.setState({selectedAsset: this.props.selectedAsset})
    if (this.props.showTokenImportedModal) {
      this.setState({showTokenImportedModal: true})
    }
  }

  filterAssets = (assets) => {
    var filter = this.state.filter ? this.state.filter.toLowerCase() : ""
    var filteredAssets = assets.filter(a => 
      (this.isNullOrEmpty(filter) || 
      a.symbol.toLowerCase().includes(filter) || 
      a.address.toLowerCase() === filter)
    )

    if (filteredAssets === null || filteredAssets.length === 0) {
      getByAddress(this.state.filter).then(asset => {
        if (asset) {
          filteredAssets.push(asset)
        }
        this.setState({assets:assets, filteredAssets: filteredAssets})
      })
    }
    else {
      this.setState({assets:assets, filteredAssets: filteredAssets})
    }
  }

  isNullOrEmpty = (value) => {
    return value === null || value === ""
  }

  onHideModal = () => {
    this.setState({showModal:false})
  }

  onShowModal = () => {
    if (!this.props.disabled) {
      this.setState({showModal:true})
    }
  }

  onFilterChange = (e) => {
    this.setState({filter: e.target.value}, () => {
      this.filterAssets(this.state.assets)
    })
  }

  onAssetSelect = (asset) => () => {
    this.setState({selectedAsset: asset, showModal:false, showTokenImportedModal: asset !== null})
    this.props.onAssetSelected(asset)
  }

  getAssetIcon = (asset) => {
    var iconUrl = this.context && this.context.assetsImages && this.context.assetsImages[asset.symbol]
    if (iconUrl) {
      return <img alt="" src={iconUrl}></img>
    }
    else {
      return <FontAwesomeIcon icon={faQuestionCircle}></FontAwesomeIcon>
    }
  }

  onCancel = () => {
    this.onAssetSelect(null)()
  }

  onConfirm = () => {
    this.setState({showTokenImportedModal: false})
  }

  render() {
    return (
      <div className={"asset-input " + (!this.props.disabled ? "clickable" : "")}>
        <div className="" onClick={this.onShowModal}>
          {this.state.selectedAsset ? 
            <div className="selected-asset nowrap">
              {this.getAssetIcon(this.state.selectedAsset)}
              {this.state.selectedAsset.symbol}
            </div> : 
            <div>Select a token</div>
          }
        </div>
        <Modal className="asset-input-modal aco-modal" centered={true} size="sm" show={this.state.showModal} onHide={this.onHideModal}>
          <Modal.Header closeButton>
            Select a token <FontAwesomeIcon data-tip data-for="asset-input-tooltip" icon={faInfoCircle}></FontAwesomeIcon>
            <ReactTooltip className="asset-input-tooltip" id="asset-input-tooltip">
              Find a token by searching for its name or symbol or by pasting its address below.
            </ReactTooltip>
          </Modal.Header>
          <Modal.Body>
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  <div className="search-input-wrapper">
                    <input onChange={this.onFilterChange} value={this.state.filter} placeholder="Search symbol or address"></input>
                    <FontAwesomeIcon icon={faSearch}/>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="token-name-title">Token Name</div>
                </div>
              </div>
              <div className="overflow-auto">
                {this.state.filteredAssets.map(asset => (
                  <div key={asset.address} className="col-md-12 asset-option" onClick={this.onAssetSelect(asset)}>
                    {this.getAssetIcon(asset)}
                    {asset.symbol}
                  </div>
                ))}
              </div>
            </div>
          </Modal.Body>
        </Modal>
        {this.state.selectedAsset && this.state.selectedAsset.foundByAddress && this.state.showTokenImportedModal && <TokenImportedModal selectedAsset={this.state.selectedAsset} assetIcon={this.getAssetIcon(this.state.selectedAsset)} onConfirm={this.onConfirm} onCancel={this.onCancel}></TokenImportedModal>}
      </div>
    )
  }
}
AssetInput.contextTypes = {
  assetsImages: PropTypes.object
}
export default withRouter(AssetInput)