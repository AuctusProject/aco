import './NavBar.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link, NavLink } from 'react-router-dom'
import { withRouter } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretDown, faCog, faEllipsisH, faExternalLinkAlt, faSignOutAlt, faTimes } from '@fortawesome/free-solid-svg-icons'
import { ellipsisCenterOfText, getPairIdFromRoute, ModeView } from '../util/constants'
import SlippageConfig from './SlippageConfig'
import { explorerUrl, getDefaultNetworkName, getDefaultNetworkIconUrl, getNetworkName, getNetworkIconUrl, menuConfig } from '../util/network'

class NavBar extends Component {
  constructor(props){
    super(props)
		this.state = {
      showAdvancedTootlip: false,
      showSlippageDropdown: false
    }
  }

  componentDidMount = () => {
  }

  componentWillUnmount = () => {    
    document.removeEventListener('click', this.handleClickOutside)
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.componentDidMount()
    } else {
      if (this.props.toggleAdvancedTooltip !== prevProps.toggleAdvancedTooltip) {
        this.setState({showAdvancedTootlip: !window.localStorage.getItem('DISMISS_ADVANCED_TOOLTIP_V2')})
      }
    }
  }

  onTestCheckChange = () => {
    this.setState({testCheck: !this.state.testCheck})
  }

  isAdvanced = () => {
    return window.location.pathname.indexOf("advanced") > 0
  }

  onDismissAdvancedTooltip = () => {
    this.setState({showAdvancedTootlip: false})
    window.localStorage.setItem('DISMISS_ADVANCED_TOOLTIP_V2', '1')
  }

  getUrlWithPairId = (baseUrl) => {
    var pairId = getPairIdFromRoute(this.props.location)
    if (pairId) {
      return baseUrl + "/" + pairId
    }
    return baseUrl
  }

  hideSubmenu = () => {
    var self = this
    self.setSubmenuDisplayStyle("none")
    setTimeout(() => self.setSubmenuDisplayStyle(null), 1)
  }

  setSubmenuDisplayStyle = (value) => {
    var element = document.body.getElementsByClassName("subnav-content")[0]
    if (element) {
      element.style.display = value
    }    
  }

  submenuClick = () => {
    this.hideSubmenu()
  }

  signOut() {
    this.props.disconnect() 
  }

  closeSlippageDropdown = () => {
    this.setState({showSlippageDropdown: false})
  }

  toggleSlippageDropdown = () => {
    this.setState({showSlippageDropdown: !this.state.showSlippageDropdown})
  }

  setModeView = (modeView) => {
    if (this.props.modeView !== modeView) {
      this.props.setModeView(modeView)
      this.navigateOnModeChange()
    }
  }

  navigateOnModeChange = () => {
    var url = ""
    if (window.location.pathname.indexOf("otc/trade") > 0 || window.location.pathname.indexOf("otc/manage") > 0) {
      return
    } else if (window.location.pathname.indexOf("buy") > 0 || window.location.pathname.indexOf("write") > 0 || window.location.pathname.indexOf("manage") > 0) {
      url = "/advanced/trade"
    } else if (window.location.pathname.indexOf("advanced/trade") > 0 || window.location.pathname.indexOf("advanced/mint") > 0 || window.location.pathname.indexOf("advanced/exercise") > 0) {
      url = "/buy"
    }
    else {
      return
    }

    url = this.getUrlWithPairId(url)
    this.props.history.push(url)
  }
 
  render() {
    var username = this.context && this.context.web3 && this.context.web3.selectedAccount
    var validNetwork = this.context && this.context.web3 && this.context.web3.validNetwork
    var isWalletConnect = validNetwork && !this.context.web3.isBrowserProvider
    var networkName = validNetwork ? getNetworkName() : getDefaultNetworkName()
    var networkIcon = validNetwork ? getNetworkIconUrl() : getDefaultNetworkIconUrl()
    username = ellipsisCenterOfText(username)
    var menuConfigData = menuConfig()
    return (
      <div>
        <nav className={"navbar navbar-expand-lg navbar-aco navbar-dark"}>
          <div className="container-fluid">
            <div className="nav-logo logo-link">
              <Link to={`/`}>
                <img src="/logo_white.svg" className="aco-logo" alt="" />
              </Link>
            </div>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarResponsive">
              <ul className="navbar-nav mt-2 mt-lg-0 navbar-items simple-nav">
                <NavLink className="nav-item link-nav" to={this.getUrlWithPairId(this.props.modeView === ModeView.Advanced ? "/advanced/trade" : "/buy")}
                  isActive={() => 
                    this.props.modeView === ModeView.Advanced ? 
                    (window.location.pathname.indexOf("advanced") > 0) :
                    (window.location.pathname.indexOf("buy") > 0 || window.location.pathname.indexOf("manage") === 1 || window.location.pathname.indexOf("write") > 0)}
                >
                  <div className="link-title">TRADE</div>
                </NavLink>
                {menuConfigData.hasVaults && <NavLink className="nav-item link-nav" to={"/vaults"}>
                  <div className="link-title">VAULTS</div>
                </NavLink>}
                <NavLink className="nav-item link-nav pools-link" to={"/pools"}>
                  <div className="link-title">POOLS<div className="earn-badge">Earn</div></div>
                </NavLink>
                {menuConfigData.hasFarm && <NavLink className="nav-item link-nav" to={"/farm"}>
                  <div className="link-title">FARM &amp; AIRDROP</div>
                </NavLink>}
                {menuConfigData.hasOtc && <NavLink className="nav-item link-nav" to={"/otc/trade"} isActive={() => window.location.pathname.indexOf("otc/trade") > 0 || window.location.pathname.indexOf("otc/manage") > 0}>
                  <div className="link-title">OTC</div>
                </NavLink>}
              </ul>
              <ul className="navbar-nav ml-auto align-items-center">
                {this.state.showAdvancedTootlip && window.innerWidth >= 992 && !this.isAdvanced() &&
                <div className="advanced-tooltip">
                  Go to advanced mode to trade options with limit orders.
                <div className="action-btn" onClick={() => this.onDismissAdvancedTooltip()}>Dismiss</div>
                </div>}
                <li className="nav-item dropdown slippage-config"> 
                  <div className="dropdown-toggle clickable" target="_self" id="slippageConfig" role="button" aria-haspopup="true" aria-expanded="false" onClick={this.toggleSlippageDropdown}>
                    <FontAwesomeIcon icon={faCog}></FontAwesomeIcon>
                  </div>
                  <div className={"dropdown-menu " + (this.state.showSlippageDropdown ? "show" : "")} aria-labelledby="slippageConfig">
                    <FontAwesomeIcon className="close-slippage-dropdown" icon={faTimes} onClick={this.closeSlippageDropdown}></FontAwesomeIcon>
                    <SlippageConfig {...this.props}></SlippageConfig>
                    {menuConfigData.hasAdvanced && <div className="row">
                      <div className="col-md-12">
                        <div className="steps-container text-center">
                          <div className="steps-modal-title">Mode View</div>
                          <div className="btn-group pill-button-group">
                            <button onClick={() => this.setModeView(ModeView.Basic)} type="button" className={"pill-button" + (this.props.modeView === ModeView.Basic ? " active" : "")}>BASIC</button>
                            <button onClick={() => this.setModeView(ModeView.Advanced)} type="button" className={"pill-button" + (this.props.modeView === ModeView.Advanced ? " active" : "")}>ADVANCED</button>
                          </div>
                        </div>
                      </div>
                    </div>}
                  </div>
                  {this.state.showSlippageDropdown && <div className="slippage-backdrop" onClick={this.closeSlippageDropdown}></div>}
                </li>
                <li className="nav-separator"></li>
                {username && <>
                  <li className="nav-item dropdown metamask">  
                    <div className={("dark-btn network-btn" + (validNetwork ? " active" : ""))} onClick={() => this.props.signIn(null, this.context)}><img src={networkIcon} alt=""/>
                      {networkName}
                      <FontAwesomeIcon icon={faCaretDown}/>
                    </div>
                    <div className="dropdown-toggle clickable" target="_self" id="navbarProfile" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <div className="user-nav-container">
                        <div className="user-nav-wrap">
                          <img src={(isWalletConnect ? "/images/icon_walletconnect.svg" : "/images/icon_metamask.png")} alt=""></img>
                          <div>
                            <span className="wallet-address">{username}</span>
                            {validNetwork && <span className="connected-label">Connected</span>}
                            {!validNetwork && <span className="invalid-network-label">Invalid Network</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-menu" aria-labelledby="navbarProfile">
                      <a className="dropdown-item clickable" rel="noopener noreferrer" href={explorerUrl() + this.context.web3.selectedAccount} target="_blank"><FontAwesomeIcon icon={faExternalLinkAlt}></FontAwesomeIcon>&nbsp;OPEN IN ETHERSCAN</a>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-item clickable" target="_self" onClick={() => this.signOut()}><FontAwesomeIcon icon={faSignOutAlt}></FontAwesomeIcon>&nbsp;SIGN OUT</div>
                    </div>
                  </li>
                  </>
                }
                {!username && 
                  <li className="nav-item m-2 connect-nav">
                    <div className="outline-btn connect-btn" onClick={() => this.props.signIn(null, this.context)}><img src="/images/icon_metamask.png" alt=""></img>CONNECT WALLET</div>
                  </li>
                }
                <li className="nav-separator"></li>
                <li className="nav-item dropdown">
                  <div className="dropdown clickable" data-toggle="dropdown" target="_self" id="moreMenu" role="button" aria-haspopup="true" aria-expanded="false">
                    <FontAwesomeIcon icon={faEllipsisH}></FontAwesomeIcon>
                  </div>
                  <div className="dropdown-menu" aria-labelledby="moreMenu">
                    <a className="dropdown-item clickable" target="_blank" rel="noopener noreferrer" href="https://docs.auctus.org/faq">FAQ</a>
                    <a className="dropdown-item clickable" target="_blank" rel="noopener noreferrer" href="https://docs.auctus.org/">DOCS</a>
                    <a className="dropdown-item clickable" target="_blank" rel="noopener noreferrer" href="https://t.me/AuctusOptions">TELEGRAM</a>
                    <a className="dropdown-item clickable" target="_blank" rel="noopener noreferrer" href="https://discord.gg/9JqeMxs">DISCORD</a>
                    <a className="dropdown-item clickable" target="_blank" rel="noopener noreferrer" href="https://auctus.org">ABOUT</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>)   
  }
}
NavBar.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(NavBar)
