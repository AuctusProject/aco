import './TokenImportedModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import Modal from 'react-bootstrap/Modal'
import { etherscanUrl } from '../../util/constants'

class TokenImportedModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      accepted: false
    }
  }

  componentDidMount = () => {
  }

  onAcceptedChange = (event) => {
    this.setState({accepted: event.target.checked})
  }

  onConfirm = () => {
    if (this.state.accepted) {
      this.props.onConfirm()
    }
  }

  render() {
    return (
      <Modal className="token-imported-modal aco-modal" centered={true} show={true} onHide={this.onHideModal}>
        <Modal.Body>
          <div className="token-imported-title">
            <FontAwesomeIcon icon={faExclamationTriangle}></FontAwesomeIcon> Token Imported
          </div>
          <div className="check-token-msg">
            You need to check if the token is legit and compatible with Auctus Protocol.
          </div>
          <div className="erc20-msg">
          Anyone can create an ERC20 token on Ethereum with any name, including creating fake versions of existing tokens and tokens that claim to represent projects that do not have a token.
          </div>
          <ul>
            <li>Do not use deflationary/rebase tokens or tokens with transfer fees.</li>
            <li>Any other non-standard behavior from ERC20 may cause issues. Do your own research!</li>
          </ul>
          <div className="selected-asset">
            <div>{this.props.assetIcon}</div>
            <div className="name-address-col">
              <div className="asset-name">{this.props.selectedAsset.symbol}</div>
              <div className="asset-address">
                <span>{this.props.selectedAsset.address}</span>
                <a className="etherscan-link" rel="noopener noreferrer" href={etherscanUrl + this.props.selectedAsset.address} target="_blank">(View on Etherscan)</a>
              </div>
            </div>            
          </div>
          <div className="form-group form-check">
            <input type="checkbox" onChange={this.onAcceptedChange} checked={this.state.accepted} className="form-check-input clickable" id="tokenImportedAgreement"/>
            <label className="form-check-label clickable" htmlFor="tokenImportedAgreement">
              By checking this box, you agree that Auctus is not liable for any losses you might incur as a direct or indirect result of trading this option.
            </label>
          </div>
          <div className="done-button-wrapper">
            <div className="aco-button cancel-btn" onClick={this.props.onCancel}>Cancel</div>
            <div className={"aco-button action-btn " + (this.state.accepted ? "" : "disabled")} onClick={this.onConfirm}>Confirm</div>
          </div>
        </Modal.Body>
      </Modal>
    )
  }
}
TokenImportedModal.contextTypes = {
  assetsImages: PropTypes.object
}
export default withRouter(TokenImportedModal)