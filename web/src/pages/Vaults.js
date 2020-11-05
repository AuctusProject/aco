import './Vaults.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { acoVaults } from '../util/constants'
import VaultDetails from '../partials/Vault/VaultDetails'
import { getCRVAPY } from '../util/getCRVAPY'

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
        {Object.keys(acoVaults).map(vaultAddress => 
          <VaultDetails key={vaultAddress} {...this.props} CRVAPYs={this.state.CRVAPYs} vaultAddress={vaultAddress}></VaultDetails>
        )}
      </div>
    </div>
  }
}

Vaults.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Vaults)