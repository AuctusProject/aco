import './NetworkModal.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import Modal from 'react-bootstrap/Modal'
import { CHAIN_ID, getAvailableNetworksData, getNetworkName } from '../util/network.js'
import { switchNetwork } from '../util/web3Methods'

class NetworkModal extends Component {
  constructor(props){
    super(props)
		this.state = {
      showEip3326Message: false
    }
  }

  setNetwokrMessage(networkName) {
    this.setState({showEip3326Message: true, networkName: networkName})
  }

  selectNetwork = (network) => {
    if (network.CHAIN_ID !== this.context.web3.networkId) {
      if (this.context.web3.isBrowserProvider) {
        let customRpc = network.customRpc
        if (customRpc) {
          switchNetwork(customRpc)
          this.props.onHide()
        } else {
          this.setNetwokrMessage(network.name)
        }
      } else {
        this.setNetwokrMessage(network.name)
      }
    }
  }

  render() {
    if (!this.context || !this.context.web3 || !this.context.web3.hasWeb3Provider) {
      this.props.onHide()
    }
    var networkName = getNetworkName()
    return (
      <Modal className="aco-modal no-header" centered={true} size="sm" show={true} onHide={() => this.props.onHide()}>
        <Modal.Header closeButton></Modal.Header>
        {this.state.showEip3326Message ?
        <Modal.Body>
          <div className="network-modal-header">
            <div className="network-modal-header-title">Update your network</div>
          </div>
          <img className="network-change-img" src="/images/network_change.png" alt=""/>
          <div className="network-modal-footer">
            Due to <a href="https://github.com/ethereum/EIPs/pull/3326" rel="noopener noreferrer" target="_blank">EIP-3326</a> not being deployed, you must manually switch to {this.state.networkName} on your wallet provider.
          </div>
        </Modal.Body>:
        <Modal.Body>
          <div className="network-modal-header">
            <div className="network-modal-header-title">Select Network</div>
            {this.context.web3.networkId === CHAIN_ID() && <div className="network-modal-header-subtitle">You are currently connected to the <span>{networkName}</span> network</div>}
            {this.context.web3.networkId !== CHAIN_ID() && <div className="network-modal-header-subtitle">Select one of the supported networks below</div>}
          </div>
          <div className="network-modal-body">
            {getAvailableNetworksData().map(network => 
              <div key={network.CHAIN_ID} className={("dark-btn" + (this.context.web3.networkId === network.CHAIN_ID ? " active" : ""))} onClick={() => this.selectNetwork(network)}><img src={network.iconUrl} alt=""/>{network.name}</div>
            )} 
          </div>
        </Modal.Body>
        
        }
      </Modal>)   
  }
}
NetworkModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(NetworkModal)
