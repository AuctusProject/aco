import './NetworkModal.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import Modal from 'react-bootstrap/Modal'
import { getAvailableNetworksData } from '../util/network.js'
import { switchNetwork } from '../util/web3Methods'
import { error } from '../util/sweetalert'


class NetworkModal extends Component {
  constructor(props){
    super(props)
		this.state = {
    }
  }

  setNetwokrMessage(networkName) {
    error("Please connect to the " + networkName + ".", "Set Network")
  }

  selectNetwork = (network) => {
    if (network.CHAIN_ID !== this.context.web3.networkId) {
      if (this.context.web3.isBrowserProvider) {
        let customRpc = network.customRpc
        if (customRpc) {
          switchNetwork(customRpc)
        } else {
          this.setNetwokrMessage(network.name)
        }
      } else {
        this.setNetwokrMessage(network.name)
      }
    }
    this.props.onHide()
  }

  render() {
    if (!this.context || !this.context.web3 || !this.context.web3.hasWeb3Provider) {
      this.props.onHide()
    }
    return (
      <Modal className="aco-modal" centered={true} size="sm" show={true} onHide={() => this.props.onHide()}>
        <Modal.Header closeButton>Select Network</Modal.Header>
        <Modal.Body>
          <div className="network-modal-body">
            {getAvailableNetworksData().map(network => 
              <div key={network.CHAIN_ID} className={("dark-btn" + (this.context.web3.networkId === network.CHAIN_ID ? " active" : ""))} onClick={() => this.selectNetwork(network)}><img src={network.iconUrl} alt=""/>{network.name}</div>
            )} 
          </div>
        </Modal.Body>
      </Modal>)   
  }
}
NetworkModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(NetworkModal)
