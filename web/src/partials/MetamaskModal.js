import './MetamaskModal.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connectMetamask } from '../util/web3Methods'
import Modal from 'react-bootstrap/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'


class MetamaskModal extends Component {
  constructor(props){
    super(props)
		this.state = {
      connecting: false
    }
  }

  onMetamaskClick = () => {
    this.setState({ connecting: true })
    connectMetamask().then(() => {
      window.localStorage.setItem('METAMASK_ACCOUNTS_AVAILABLE', '1')
      this.props.onHide(true)
    }).finally(() =>
      this.setState({ connecting: false })
    )
  }

  render() {
    var hasMetamask = this.context && this.context.web3 && this.context.web3.hasMetamask
    var username = this.context && this.context.web3 && this.context.web3.selectedAccount
    if (username) {
      this.props.history.push('/mint')
      this.props.onHide()
    }
    return (
      <Modal className="metamask-modal" centered={true} size="sm" show={true} onHide={(e) => this.props.onHide()}>
        <Modal.Header closeButton>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              <div className="metamask-container text-center">
                <div className="logo-wrapper"><img className="logo-img" src="/logo.svg" alt=""/></div>
                <div className="metamask-modal-title">Connect Wallet</div>
                <div className="metamask-modal-subtitle">To start using ACO.</div>
                {hasMetamask &&
                  <>
                    {!this.state.connecting && 
                    <div className="connect-metamask-row" onClick={this.onMetamaskClick}>
                      <img className="metamask-icon" src="/images/icon_metamask.png" alt=""/>
                      <span>Metamask</span>
                      <FontAwesomeIcon icon={faArrowRight}/>
                    </div>}
                    {this.state.connecting && 
                    <div className="connect-metamask-row disabled">
                      <img src="/images/icon_metamask.png" alt=""/>
                      <span>Connecting...</span>                      
                    </div>}
                  </>
                }
                {!hasMetamask && 
                  <a className="connect-metamask-row" href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer">
                    <img src="/images/icon_metamask.png" alt=""/>
                    <span>Install Metamask</span>
                    <FontAwesomeIcon icon={faArrowRight}/>
                  </a>
                }
                <div className="accept-terms">By connecting, I accept ACO's <a href="/terms" target="_blank">Terms of Service</a></div>
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
