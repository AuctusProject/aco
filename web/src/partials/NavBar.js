import './NavBar.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link, NavLink } from 'react-router-dom'
import { withRouter } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faExternalLinkAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import { etherscanUrl, ellipsisCenterOfText, getPairIdFromRoute, isDarkMode } from '../util/constants'
import PairDropdown from './PairDropdown'
import { listPairs } from '../util/acoFactoryMethods'

class NavBar extends Component {
  constructor(props){
    super(props)
		this.state = {
      pairs: null,
      showAdvancedTootlip: false,
      darkMode: isDarkMode(),
      showOptionsSubmenu: false
    }
  }

  componentDidMount = () => {
    if (this.context && this.context.web3 && this.context.web3.validNetwork) {
      listPairs().then(pairs => {
        this.setState({pairs:pairs})
        this.props.onPairsLoaded(pairs)
      })
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.toggleAdvancedTooltip !== prevProps.toggleAdvancedTooltip) {
      this.setState({showAdvancedTootlip: !window.localStorage.getItem('DISMISS_ADVANCED_TOOLTIP')})
    }
    if (this.props.darkMode !== prevProps.darkMode && this.props.darkMode !== this.state.darkMode) {
      this.setState({darkMode: this.props.darkMode})
    }
  }

  onLayoutModeChange = () => {
    var newDarkMode = !this.state.darkMode
    var self = this
    this.setState({darkMode: newDarkMode}, 
      () => self.props.setLayoutMode(newDarkMode)
    )
  }

  onTestCheckChange = () => {
    this.setState({testCheck: !this.state.testCheck})
  }

  isAdvanced = () => {
    return window.location.pathname.indexOf("advanced") > 0
  }

  onDismissAdvancedTooltip = () => {
    this.setState({showAdvancedTootlip: false})
    window.localStorage.setItem('DISMISS_ADVANCED_TOOLTIP', '1')
  }

  changeMode = () => {
    var url = ""
    if (window.location.pathname.indexOf("buy") > 0) {
      url = "/advanced/trade"
    } else if (window.location.pathname.indexOf("write") > 0) {
      url = "/advanced/mint"
    } else if (window.location.pathname.indexOf("manage") > 0) {
      url = "/advanced/exercise"
    } else if (window.location.pathname.indexOf("trade") > 0) {
      url = "/buy"
    } else if (window.location.pathname.indexOf("mint") > 0) {
      url = "/write"
    } else if (window.location.pathname.indexOf("exercise") > 0) {
      url = "/manage"
    } else if (window.location.pathname.indexOf("advanced/pools") > 0) {
      url = "/pools"
    } else if (window.location.pathname.indexOf("pools") > 0) {
      url = "/advanced/pools"
    } else if (window.location.pathname.indexOf("advanced/vaults") > 0) {
      url = "/vaults"
    } else if (window.location.pathname.indexOf("vaults") > 0) {
      url = "/advanced/vaults"
    }

    url = this.getUrlWithPairId(url)
    
    if (this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork) {
      this.props.history.push(url)
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

  toggleOptionsSubmenu = () => {
    this.setState({showOptionsSubmenu: !this.state.showOptionsSubmenu})
  }

  signOut() {
    this.props.disconnect() 
  }
 
  render() {
    var username = this.context && this.context.web3 && this.context.web3.selectedAccount
    var validNetwork = this.context && this.context.web3 && this.context.web3.validNetwork
    username = ellipsisCenterOfText(username)
    return (
      <div>
        <nav className={"navbar navbar-expand-lg navbar-aco " + (this.state.darkMode ? "navbar-dark" : "navbar-light")}>
          <div className="container-fluid">
            <div className="nav-logo logo-link">
              <Link to={`/`}>
                <img src={this.state.darkMode ? "/logo_white.svg" : "/logo.svg"} className="aco-logo" alt="" />
              </Link>
            </div>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarResponsive">
              {this.isAdvanced() && 
              <ul className="navbar-nav">
                <PairDropdown {...this.props} pairs={this.state.pairs}></PairDropdown>
              </ul>}
              {!this.isAdvanced() && <ul className="navbar-nav mt-2 mt-lg-0 navbar-items simple-nav">
                <div className="nav-item link-nav">
                  <div onClick={this.toggleOptionsSubmenu} className={"options-nav-item " + (this.state.showOptionsSubmenu ? "options-expanded" : "")}>OPTIONS<FontAwesomeIcon className="nav-chevron" icon={faChevronDown}/></div>
                  <div className="subnav-content">
                    <div className="container">
                      <NavLink onClick={this.submenuClick} to={this.getUrlWithPairId("/buy")}>
                        <div className="subnav-link">
                          <div className="subnav-link-title">TRADE OPTIONS</div>
                          <div className="subnav-link-description">Start trading non-custodial options immediately.</div>
                        </div>
                      </NavLink>
                      <NavLink onClick={this.submenuClick} to="/pools">
                        <div className="subnav-link">
                          <div className="subnav-link-title">POOLS</div>
                          <div className="subnav-link-description">Become a liquidity provider and receive premiums by automatically selling covered options.</div>
                        </div>
                      </NavLink>
                      <NavLink onClick={this.submenuClick} to={"/otc/trade"}>
                        <div className="subnav-link">
                          <div className="subnav-link-title">OTC</div>
                          <div className="subnav-link-description">Trade options on any token with a customized strike price, expiration and counterparty.</div>
                        </div>
                      </NavLink>
                      <a onClick={this.submenuClick} target="_blank" rel="noopener noreferrer" href="https://docs.auctus.org/">
                        <div className="subnav-link">
                          <div className="subnav-link-title">LEARN ABOUT OPTIONS</div>
                          <div className="subnav-link-description">Learn the basics of crypto options, explore strategies for trading them.</div>
                        </div>
                      </a>
                      <div className="nav-separator"></div>
                      <div className="subnav-link">
                        <a className="nav-item link-nav" target="_blank" rel="noopener noreferrer" href="https://auctus.org">ABOUT</a>
                        <a className="nav-item link-nav" target="_blank" rel="noopener noreferrer" href="https://docs.auctus.org/faq">FAQ</a>
                        <a className="nav-item link-nav" target="_blank" rel="noopener noreferrer" href="https://docs.auctus.org/">DOCS</a>
                        <a className="nav-item link-nav" target="_blank" rel="noopener noreferrer" href="https://discord.gg/9JqeMxs">DISCORD</a>
                      </div>
                    </div>
                  </div>
                  {this.state.showOptionsSubmenu && <div className="subnav-content-mobile">
                    <div className="container">
                      <NavLink to={this.getUrlWithPairId("/buy")}>
                        <div className="subnav-link">
                          <div className="subnav-link-title">TRADE OPTIONS</div>
                        </div>
                      </NavLink>
                      <NavLink onClick={this.submenuClick} to="/pools">
                        <div className="subnav-link">
                          <div className="subnav-link-title">POOLS</div>
                        </div>
                      </NavLink>
                      <NavLink onClick={this.submenuClick} to={"/otc/trade"}>
                        <div className="subnav-link">
                          <div className="subnav-link-title">OTC</div>
                        </div>
                      </NavLink>
                    </div>
                  </div>}
                </div>
                <NavLink className="nav-item link-nav" to={this.getUrlWithPairId("/vaults")}>
                  <div className="link-title">VAULTS</div>
                  <div className="link-subtitle">Automated Strategies</div>
                </NavLink>
                <NavLink className="nav-item link-nav" to={"/pools"}>
                  <div className="link-title">POOLS</div>
                  <div className="link-subtitle">Provide Liquidity</div>
                </NavLink>
                <NavLink className="nav-item link-nav" to={"/farm"}>
                  <div className="link-title">FARM &amp; AIRDROP</div>
                  <div className="link-subtitle">Earn AUC options</div>
                </NavLink>
              </ul>}
              {this.isAdvanced() && 
              <ul className="navbar-nav mx-auto mt-2 mt-lg-0 navbar-items advanced">
                <NavLink className="nav-item link-nav" to={this.getUrlWithPairId("/advanced/trade")}>Trade</NavLink>
                <NavLink className="nav-item link-nav" to={this.getUrlWithPairId("/advanced/mint")}>Mint</NavLink>
                <NavLink className="nav-item link-nav" to={this.getUrlWithPairId("/advanced/exercise")}>Exercise</NavLink>
              </ul>}
              <ul className="navbar-nav ml-auto">
                {username &&
                  <li className="nav-item dropdown metamask">                  
                    <div className="dropdown-toggle clickable" target="_self" id="navbarProfile" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <div className="user-nav-container">
                        <div className="user-nav-wrap">
                          <img src="/images/icon_metamask.png" alt=""></img>
                          <div>
                            <span className="wallet-address">{username}</span>
                            {validNetwork && <span className="connected-label">Connected</span>}
                            {!validNetwork && <span className="invalid-network-label">Incorrect Network</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-menu" aria-labelledby="navbarProfile">
                      <a className="dropdown-item clickable" rel="noopener noreferrer" href={etherscanUrl + this.context.web3.selectedAccount} target="_blank"><FontAwesomeIcon icon={faExternalLinkAlt}></FontAwesomeIcon>&nbsp;OPEN IN ETHERSCAN</a>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-item clickable" target="_self" onClick={() => this.signOut()}><FontAwesomeIcon icon={faSignOutAlt}></FontAwesomeIcon>&nbsp;SIGN OUT</div>
                    </div>
                  </li>
                }
                {!username && 
                  <li className="nav-item my-2 connect-nav">
                    <div className="outline-btn connect-btn" onClick={() => this.props.signIn(null, this.context)}><img src="/images/icon_metamask.png" alt=""></img>CONNECT WALLET</div>
                  </li>
                }
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
