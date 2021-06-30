import './Simple.css'
import React, { Component } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import PairDropdown from '../partials/PairDropdown'
import SimpleBuyTab from '../partials/Simple/SimpleBuyTab'
import SimpleWriteTab from '../partials/Simple/SimpleWriteTab'
import SimpleManageTab from '../partials/Simple/SimpleManageTab'
import { getPairIdFromRoute, ModeView } from '../util/constants'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { getAvailableOptions, getOptionsFromPair, getPairsFromOptions } from '../util/dataController'
import { auctusAddress, menuConfig } from '../util/network'

class Simple extends Component {
  constructor() {
    super()
    this.state = { 
      pairs: null, 
      toggleOptionsLoaded: false,
      refreshExercise: false, 
      refreshWrite: false
    }
  }
  
  componentDidMount = () => {
    this.props.toggleAdvancedTooltip()
    if (this.props.modeView !== ModeView.Basic) {
      this.props.setModeView(ModeView.Basic)
    }
    this.loadAvailableOptions(false)
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.componentDidMount()
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

  render() {
    var filteredOptions = this.getOptionsFromPair()
    var menuConfigData = menuConfig()
    return <div className="py-4 simple-page">
        <div className="beta-alert"><FontAwesomeIcon icon={faExclamationCircle}></FontAwesomeIcon>Exercise is not automatic, please remember manually exercising in-the-money options before expiration.</div>    
        <div className="pair-and-mode-wrapper">
          <ul className="pair-dropdown-wrapper">
            <PairDropdown {...this.props} pairs={this.state.pairs}></PairDropdown>
          </ul>
        </div>        
        <div className="simple-box">
          <ul className="nav nav-tabs nav-fill" id="simpleTabs" role="tablist">
            <li className="nav-item">
              <NavLink className="nav-link" to={this.getUrlWithPairId(`/buy`)}>Buy</NavLink>
            </li>
            {menuConfigData.hasAdvanced && <li className="nav-item">
              <NavLink className="nav-link" to={this.getUrlWithPairId(`/write`)}>Write</NavLink>
            </li>}
            <li className="nav-item">
              <NavLink className="nav-link" to={this.getUrlWithPairId(`/manage`)}>Manage</NavLink>
            </li>
          </ul>
          <div className="tab-content" id="simpleTabsContent">
            <div className={"tab-pane fade" + (window.location.pathname.indexOf("buy") > 0 ? " show active" : "")}>
              <SimpleBuyTab {...this.props} isConnected={this.isConnected()} options={filteredOptions} toggleOptionsLoaded={this.state.toggleOptionsLoaded} refreshExercise={() => this.setState({refreshExercise:true})}/>
            </div>
            {menuConfigData.hasAdvanced && <div className={"tab-pane fade" + (window.location.pathname.indexOf("write") > 0 ? " show active" : "")}>
              <SimpleWriteTab {...this.props} isConnected={this.isConnected()} options={filteredOptions} toggleOptionsLoaded={this.state.toggleOptionsLoaded} refreshWrite={() => this.setState({refreshWrite:true})}/>
            </div>}
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