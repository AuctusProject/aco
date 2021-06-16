import './Vaults.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import VaultDetails from '../partials/Vault/VaultDetails'
import { getCRVAPY } from '../util/getCRVAPY'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DiscontinuedVaultDetails from '../partials/Vault/DiscontinuedVaultDetails'
import { acoVaults, acoVaultsV2 } from '../util/network'

class Vaults extends Component {
  constructor() {
    super()
    this.state = { allVaults:[], loading: true, CRVAPYs: null }
  }

  componentDidMount = () => {
    getCRVAPY().then(CRVAPYs => this.setState({CRVAPYs: CRVAPYs}))
  }

  render() {
    return <div className="vaults">
      <div className="beta-alert"><FontAwesomeIcon icon={faExclamationCircle}/>Vault is in beta. Use at your own risk.</div>
      <div className="vaults-title">VAULTS</div>
      <div className="vaults-subtitle">Automated strategies using options</div>
      <div className="vault-asset">
        <img className="asset-icon" src={"/images/usdc_icon.svg"} alt=""></img>
        <div className="vault-asset-details">
          <div className="vault-asset-name">USDC ETH CALL</div>
          <div className="vault-asset-description">Get ETH exposure through purchase of ETH call options with stablecoin Yield</div>
        </div>
      </div>
      <div className="accordion" id="vaultsAccordion">
        {acoVaults() && Object.keys(acoVaults()).map(vaultAddress => 
          <DiscontinuedVaultDetails key={vaultAddress} {...this.props} CRVAPYs={this.state.CRVAPYs} vaultAddress={vaultAddress} />
        )}
        {acoVaultsV2() && Object.keys(acoVaultsV2()).map(vaultAddress => 
          <VaultDetails key={vaultAddress} {...this.props} CRVAPYs={this.state.CRVAPYs} vaultAddress={vaultAddress} />
        )}
      </div>
    </div>
  }
}

Vaults.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Vaults)