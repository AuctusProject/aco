import './MetamaskModal.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import Modal from 'react-bootstrap/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'


class MetamaskModal extends Component {
  constructor(props){
    super(props)
		this.state = {
    }
  }

  onConnectClick = (connector) => {
    this.props.connect(connector)
  }

  render() {
    let hasWeb3Provider = this.context.web3.hasWeb3Provider
    let isMobile = window.innerWidth <= 768
    let username = this.context && this.context.web3 && this.context.web3.selectedAccount
    if (username) {
      this.props.onHide()
    }
    return (
      <Modal className={"metamask-modal "+ (this.props.darkMode ? "" : "")}  centered={true} size="sm" show={true} onHide={(e) => this.props.onHide()}>
        <Modal.Header closeButton>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              <div className="metamask-container text-center">
                <div className="logo-wrapper">
                  <img src={this.props.darkMode ? "/logo_white_sm.svg" : "/logo_sm.svg"} className="logo-img" alt="" />
                </div>
                <div className="metamask-modal-title">Connect Wallet</div>
                <div className="metamask-modal-subtitle mb-4">To start using Auctus.</div>
                {hasWeb3Provider &&
                  <>
                    {!this.props.connecting && 
                    <div className="connect-connect-row" onClick={() => this.onConnectClick("injected")}>
                      <img className="connect-icon" src="/images/icon_metamask.png" alt=""/>
                      <span>Metamask</span>
                      <FontAwesomeIcon icon={faArrowRight}/>
                    </div>}
                    {this.props.connecting && 
                    <div className="connect-connect-row disabled">
                      <img className="connect-icon" src="/images/icon_metamask.png" alt=""/>
                      <span>Connecting...</span>                      
                    </div>}
                  </>
                }
                {!hasWeb3Provider && !isMobile &&
                  <a className="connect-connect-row" href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer">
                    <img className="connect-icon" src="/images/icon_metamask.png" alt=""/>
                    <span>Install Metamask</span>
                    <FontAwesomeIcon icon={faArrowRight}/>
                  </a>
                }
                <>
                  {!this.props.connecting && 
                  <div className="connect-connect-row" onClick={() => this.onConnectClick("walletconnect")}>
                    <img className="connect-icon" src="/images/icon_walletconnect.svg" alt=""/>
                    <span>Wallet Connect</span>
                    <FontAwesomeIcon icon={faArrowRight}/>
                  </div>}
                  {this.props.connecting && 
                  <div className="connect-connect-row disabled">
                    <img className="connect-icon" src="/images/icon_walletconnect.svg" alt=""/>
                    <span>Connecting...</span>                      
                  </div>}
                </>
                <div className="accept-terms">By connecting, I accept Auctus' <a href="/terms" target="_blank">Terms of Service</a></div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>)   
  }
}
MetamaskModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(MetamaskModal)
