import './Simple.css'
import React, { Component } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import PairDropdown from '../partials/PairDropdown'
import SimpleBuyTab from '../partials/Simple/SimpleBuyTab'
import SimpleWriteTab from '../partials/Simple/SimpleWriteTab'
import SimpleManageTab from '../partials/Simple/SimpleManageTab'
import { getPairIdFromRoute } from '../util/constants'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import Pools from './Pools'
import { getAvailableOptions, getOptionsFromPair, getPairsFromOptions } from '../util/dataController'
import { auctusAddress } from '../util/network'

class Simple extends Component {
  constructor() {
    super()
    this.state = { 
      pairs: null, 
      toggleOptionsLoaded: false, 
      showAdvancedTootlip: false,
      refreshExercise: false, 
      refreshWrite: false
    }
  }
  
  componentDidMount = () => {
    this.props.toggleAdvancedTooltip()
    this.loadAvailableOptions(false)
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.componentDidMount()
    }
    else if (this.props.toggleAdvancedTooltip !== prevProps.toggleAdvancedTooltip) {
      this.setState({showAdvancedTootlip: !window.localStorage.getItem('DISMISS_ADVANCED_TOOLTIP')})
    }
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }  

  loadAvailableOptions = (forceRefresh) => {
    getAvailableOptions(forceRefresh).then(result => {
      result = result.filter(o => o.underlying.toLowerCase() !== auctusAddress())      
      var pairs = getPairsFromOptions(result)

      this.props.onPairsLoaded(pairs)
      this.setState({options: result, pairs: pairs, toggleOptionsLoaded: !this.state.toggleOptionsLoaded})
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

  getUrlWithPairId = (baseUrl) => {
    var pairId = getPairIdFromRoute(this.props.location)
    if (pairId) {
      return baseUrl + "/" + pairId
    }
    return baseUrl
  }

  openAdvancedMode = () => {
    var url = ""
    if (window.location.pathname.indexOf("buy") > 0) {
      url = "/advanced/trade"
    } else if (window.location.pathname.indexOf("write") > 0) {
      url = "/advanced/mint"
    } else if (window.location.pathname.indexOf("manage") > 0) {
      url = "/advanced/exercise"
    } else if (window.location.pathname.indexOf("pools") > 0) {
      url = "/advanced/pools"
    } else if (window.location.pathname.indexOf("vaults") > 0) {
      url = "/advanced/vaults"
    }

    url = this.getUrlWithPairId(url)
    
    if (this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork) {
      var win = window.open(url, '_blank');
      win.focus();
    }
    else {
      this.props.signIn(url, this.context)
    }
  }

  getUrlWithPairId = (baseUrl) => {
    var pairId = getPairIdFromRoute(this.props.location)
    if (pairId) {
      return baseUrl + "/" + pairId
    }
    return baseUrl
  }

  onDismissAdvancedTooltip = () => {
    this.setState({showAdvancedTootlip: false})
    window.localStorage.setItem('DISMISS_ADVANCED_TOOLTIP', '1')
  }

  render() {
    var filteredOptions = this.getOptionsFromPair()
    return <div className="py-4 simple-page">
        <div className="beta-alert"><FontAwesomeIcon icon={faExclamationCircle}></FontAwesomeIcon>Exercise is not automatic, please remember manually exercising in-the-money options before expiration.</div>    
        <div className="pair-and-mode-wrapper">
          <ul className="pair-dropdown-wrapper">
            <PairDropdown {...this.props} pairs={this.state.pairs}></PairDropdown>
          </ul>
          <ul className="nav-modes ml-auto">
            <div className="btn-group pill-button-group">
              <button type="button" className="pill-button active">BASIC</button>
              <button onClick={() => this.openAdvancedMode()} type="button" className="pill-button">ADVANCED<FontAwesomeIcon icon={faExternalLinkAlt} /></button>            
            </div>
            {this.state.showAdvancedTootlip && window.innerWidth >= 992 &&
            <div className="advanced-tooltip">
              Go to advanced mode to trade options with limit orders.
              <div className="action-btn" onClick={() => this.onDismissAdvancedTooltip()}>Dismiss</div>
            </div>}
          </ul>
        </div>
        
        <div className="simple-box">
          <ul className="nav nav-tabs nav-fill" id="simpleTabs" role="tablist">
            <li className="nav-item">
              <NavLink className="nav-link" to={this.getUrlWithPairId(`/buy`)}>Buy</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to={this.getUrlWithPairId(`/write`)}>Write</NavLink>
            </li>            
            <li className="nav-item">
              <NavLink className="nav-link" to={`/pools`}>Pools<div className="earn-badge">Earn</div></NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to={this.getUrlWithPairId(`/manage`)}>Manage</NavLink>
            </li>
          </ul>
          <div className="tab-content" id="simpleTabsContent">
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("buy") > 0 ? " show active" : "")}>
              <SimpleBuyTab {...this.props} isConnected={this.isConnected()} options={filteredOptions} toggleOptionsLoaded={this.state.toggleOptionsLoaded} refreshExercise={() => this.setState({refreshExercise:true})}/>
            </div>
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("write") > 0 ? " show active" : "")}>
              <SimpleWriteTab {...this.props} isConnected={this.isConnected()} options={filteredOptions} toggleOptionsLoaded={this.state.toggleOptionsLoaded} refreshWrite={() => this.setState({refreshWrite:true})}/>
            </div>
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("pools") > 0 ? " show active" : "")}>
              <Pools {...this.props} isConnected={this.isConnected()} />
            </div>
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("manage") > 0 ? " show active" : "")}>
              <SimpleManageTab {...this.props} isConnected={this.isConnected()} exerciseUpdated={() => this.setState({refreshExercise:false})} refreshExercise={this.state.refreshExercise} writeUpdated={() => this.setState({refreshWrite:false})} refreshWrite={this.state.refreshWrite}/>
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