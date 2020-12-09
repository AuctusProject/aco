import './Otc.css'
import React, { Component } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import OtcTradeTab from '../partials/Otc/OtcTradeTab'
import SimpleManageTab from '../partials/Simple/SimpleManageTab'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'

class Simple extends Component {
  constructor() {
    super()
    this.state = {
    }
  }
  
  componentDidMount = () => {
  }

  componentDidUpdate = (prevProps) => {
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  render() {
    return <div className="py-4">
        <div className="beta-alert"><FontAwesomeIcon icon={faExclamationCircle}></FontAwesomeIcon>OTC is in beta. Use at your own risk.</div>
        <div className="pair-and-mode-wrapper">
          <div className="pair-dropdown-wrapper">
            OTC
          </div>
          <div className="navbar-nav nav-modes ml-auto">
            Activity
          </div>
        </div>        
        <div className="simple-box">
          <ul className="nav nav-tabs justify-content-center" id="simpleTabs" role="tablist">
            <li className="nav-item">
              <NavLink className="nav-link" to="/otc/trade">New Trade</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/otc/manage">Manage</NavLink>
            </li>
          </ul>
          <div className="tab-content" id="simpleTabsContent">
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("otc/trade") > 0 ? " show active" : "")}>
              <OtcTradeTab {...this.props} isConnected={this.isConnected()}/>
            </div>
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("otc/manage") > 0 ? " show active" : "")}>
              <SimpleManageTab {...this.props} isConnected={this.isConnected()} isOtcPositions={true}/>
            </div>
          </div>
        </div>
      </div>
  }
}

Simple.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Simple)