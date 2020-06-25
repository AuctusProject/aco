import './Simple.css'
import React, { Component } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getPairsFromOptions, getOptionsFromPair } from '../util/acoFactoryMethods'
import { getTokensList } from '../util/acoApi'
import PairDropdown from '../partials/PairDropdown'
import SimpleBuyTab from '../partials/Simple/SimpleBuyTab'
import SimpleWriteTab from '../partials/Simple/SimpleWriteTab'
import SimpleManageTab from '../partials/Simple/SimpleManageTab'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'

class Simple extends Component {
  constructor() {
    super()
    this.state = { pairs: null }
  }
  
  componentDidMount = () => {
    this.loadAvailableOptions()
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }  

  loadAvailableOptions = () => {
    getTokensList().then(result => {
      var pairs = getPairsFromOptions(result)
      this.props.onPairsLoaded(pairs)
      this.setState({options: result, pairs: pairs})
    })
  }

  setPosition = (position) => {
    this.setState({position: position})
  }

  onCancelClick = () => {
    this.setPosition(null)
  }
  
  getOptionsFromPair = () => {
    return getOptionsFromPair(this.state.options, this.props.selectedPair)
  }

  render() {
    var filteredOptions = this.getOptionsFromPair()
    return <div className="py-4">
      <div className="beta-alert"><FontAwesomeIcon icon={faExclamationCircle}></FontAwesomeIcon>This project is in beta. Use at your own risk.</div>
        <ul className="pair-dropdown-wrapper"><PairDropdown {...this.props} pairs={this.state.pairs}></PairDropdown></ul>
        <div className="simple-box">
          <ul className="nav nav-tabs justify-content-center" id="simpleTabs" role="tablist">
            <li className="nav-item">
              <NavLink className="nav-link" to={`/buy`}>Buy</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to={`/write`}>Write<div className="earn-badge">Earn</div></NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to={`/manage`}>Manage</NavLink>
            </li>
          </ul>
          <div className="tab-content" id="simpleTabsContent">
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("buy") > 0 ? " show active" : "")}>
              <SimpleBuyTab {...this.props} isConnected={this.isConnected()} options={filteredOptions}/>
            </div>
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("write") > 0 ? " show active" : "")}>
              <SimpleWriteTab {...this.props} isConnected={this.isConnected()} options={filteredOptions}/>
            </div>
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("manage") > 0 ? " show active" : "")}>
              <SimpleManageTab {...this.props} isConnected={this.isConnected()} options={filteredOptions}/>
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