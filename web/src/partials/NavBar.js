import './NavBar.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link, NavLink } from 'react-router-dom'
import { withRouter } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import { etherscanUrl, ellipsisCenterOfUsername } from '../util/constants'
import PairDropdown from './PairDropdown'
import { listPairs } from '../util/acoFactoryMethods'

class NavBar extends Component {
  constructor(props){
    super(props)
		this.state = {
      pairs: null
    }
  }

  componentDidMount = () => {
    listPairs().then(pairs => {
      this.setState({pairs:pairs})
      this.props.onPairsLoaded(pairs)
    })
  }

  render() {
    var username = this.context && this.context.web3 && this.context.web3.selectedAccount
    var validNetwork = this.context && this.context.web3 && this.context.web3.validNetwork
    username = ellipsisCenterOfUsername(username)
    return (
      <div>
        <nav className="navbar navbar-expand-lg navbar-dark navbar-aco">
          <div className="container-fluid">
            <Link className="logo-link" to={`/`}>
              <img src="/logo.png" alt="Auctus Crypto Options" />
            </Link>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarResponsive">
              <ul className="navbar-nav mx-auto mt-2 mt-lg-0 navbar-items">
                <NavLink className="nav-item link-nav" to="/trade">Trade</NavLink>
                <NavLink className="nav-item link-nav" to="/mint">Mint</NavLink>
                <NavLink className="nav-item link-nav" to="/exercise">Exercise</NavLink>
              </ul>
              <ul className="navbar-nav">
                <PairDropdown {...this.props} pairs={this.state.pairs}></PairDropdown>
              </ul>
              <ul className="navbar-nav">
                {username &&
                  <li className="nav-item dropdown metamask">                  
                    <div className="dropdown-toggle nav-link clickable" target="_self" id="navbarProfile" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
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
                      <div className="dropdown-item clickable" target="_self" onClick={() => this.props.signOut()}><FontAwesomeIcon icon={faSignOutAlt}></FontAwesomeIcon>&nbsp;SIGN OUT</div>
                    </div>
                  </li>
                }
                {!username && 
                  <li className="nav-item mx-lg-2">
                    <div className="nav-link link-nav underline clickable" onClick={() => this.props.signIn("/mint")}>SIGN IN</div>
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
