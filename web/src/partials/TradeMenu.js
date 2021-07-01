import './TradeMenu.css'
import React, { Component } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import { fromDecimals, groupBy, formatDate, getPairIdFromRoute } from '../util/constants'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faEnvelope, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons'
import { ALL_OPTIONS_KEY } from '../pages/Trade'
import PairDropdown from './PairDropdown'

class TradeMenu extends Component {

  onSelectOption = (option) => {
    this.props.onSelectOption(option)
    if (this.isMobile()) {
      this.props.onCollapseClick()
    }
  }

  onSelectExpiryTime = (expiryTime) => {
    this.props.onSelectExpiryTime(expiryTime)
    if (this.isMobile()) {
      this.props.onCollapseClick()
    }
  }

  toPath = (path) => {
    this.props.history.push(this.getUrlWithPairId(path))
    if (this.isMobile()) {
      this.props.onCollapseClick()
    }
  }

  getOptionsWithBalance = () => {
    return this.props.options ? this.props.options.filter(o => this.props.balances[o.acoToken] > 0) : []
  }  

  isLogged = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount
  }

  getUrlWithPairId = (baseUrl) => {
    var pairId = getPairIdFromRoute(this.props.location)
    if (pairId) {
      return baseUrl + "/" + pairId
    }
    return baseUrl
  }

  isMobile = () => {
    return window.innerWidth <= 991
  }

  isActivePath = (path) => {
    return window.location && window.location.pathname && window.location.pathname.indexOf(path) >= 0
  }

  render() {
    var pair = this.props.selectedPair    
    var grouppedOptions = this.props.options ? groupBy(this.props.options, "expiryTime") : {}
    var balanceOptions = this.getOptionsWithBalance()
    var pairTitle = pair ? pair.underlyingSymbol + pair.strikeAssetSymbol : ""
    var iconUrl = pair && this.context && this.context.assetsImages && this.context.assetsImages[pair.underlyingSymbol]

    return (
      <div className="trade-menu">
        {(!this.props.advancedShown || !this.isMobile()) && 
        <div className="trade-menu-content-wrapper">
          <div className="trade-menu-content">
            <PairDropdown {...this.props}></PairDropdown>
            {pair && <div className="trade-menu-pair-balance-info">
              <div className="trade-menu-balance-title">BALANCE</div>
              <div className="pair-balance-items">
                <div className="pair-balance-item">
                  <div className="trade-menu-pair-symbol">{pair.underlyingSymbol}</div>
                  <div className="trade-menu-pair-balance truncate" title={this.props.balances[pair.underlying] ? fromDecimals(this.props.balances[pair.underlying], pair.underlyingInfo.decimals) : ""}>{this.props.balances[pair.underlying] ? fromDecimals(this.props.balances[pair.underlying], pair.underlyingInfo.decimals) : (this.isLogged() ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : "-")}</div>
                </div>
                <div className="pair-balance-item">
                  <div className="trade-menu-pair-symbol">{pair.strikeAssetSymbol}</div>
                  <div className="trade-menu-pair-balance truncate" title={this.props.balances[pair.strikeAsset] ? fromDecimals(this.props.balances[pair.strikeAsset], pair.strikeAssetInfo.decimals) : ""}>{this.props.balances[pair.strikeAsset] ? fromDecimals(this.props.balances[pair.strikeAsset], pair.strikeAssetInfo.decimals) : (this.isLogged() ? <FontAwesomeIcon icon={faSpinner} className="fa-spin"/> : "-")}</div>
                </div>
                {balanceOptions.map(option => (
                  <div key={option.acoToken} className="pair-balance-item clickable" onClick={() => this.onSelectOption(option)}>
                    <div className="trade-menu-pair-symbol">{option.acoTokenInfo.symbol}</div>
                    <div className="trade-menu-pair-balance truncate" title={fromDecimals(this.props.balances[option.acoToken], option.acoTokenInfo.decimals)}>{fromDecimals(this.props.balances[option.acoToken], option.acoTokenInfo.decimals)}</div>
                  </div>
                ))}
              </div>
            </div>}
            <div className="trade-menu-manage">
              <div className="trade-menu-balance-title">MANAGE</div>
              <div className={"trade-menu-manage-link" + (this.isActivePath("/advanced/mint") ? " active" : "")} onClick={() => this.toPath("/advanced/mint")}>Mint Options</div>
              <div className={"trade-menu-manage-link" + (this.isActivePath("/advanced/exercise") ? " active" : "")} onClick={() => this.toPath("/advanced/exercise")}>Exercise Options</div>
            </div>
            {pair && <div>
              <div className="trade-menu-pair-title">
                {iconUrl && <img className="asset-icon" src={iconUrl} alt=""/>}
                {pairTitle} options
              </div>
              <div className="option-expirations-wrapper">
                <div className={"option-expiration-item "+(this.props.selectedExpiryTime === ALL_OPTIONS_KEY ? "active" : "")} onClick={() => this.onSelectExpiryTime(ALL_OPTIONS_KEY)}>
                  All expirations
                </div>
                {Object.keys(grouppedOptions).map(expiryTime => (
                  <div key={expiryTime} className={"option-expiration-item "+(this.props.selectedExpiryTime === expiryTime ? "active" : "")} onClick={() => this.onSelectExpiryTime(expiryTime)}>
                    {formatDate(expiryTime)}
                  </div>
                ))}
              </div>
            </div>}
          </div>
          <div className="trade-menu-footer">
            <div className="trade-menu-footer-links">
              <NavLink to="/terms">Terms</NavLink>
              <NavLink to="/privacy">Privacy Policy</NavLink>
              <a target="_blank" rel="noopener noreferrer" href="https://docs.auctus.org/faq">FAQ</a>
              <a target="_blank" rel="noopener noreferrer" href="https://docs.auctus.org/">DOCS</a>
              <a target="_blank" rel="noopener noreferrer" href="https://defipulse.com">DeFi Pulse</a>
            </div>
            <div className="trade-menu-footer-media">
              <div>© 2021 Auctus</div>
              <div>
                <a rel="noopener noreferrer" href="mailto:contact@auctus.org"><FontAwesomeIcon icon={faEnvelope} /></a>
                <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/AuctusOptions"><FontAwesomeIcon icon={faTwitter} /></a>
                <a target="_blank" rel="noopener noreferrer" href="https://discord.gg/9JqeMxs"><FontAwesomeIcon icon={faDiscord} /></a>
                <a target="_blank" rel="noopener noreferrer" href="https://github.com/AuctusProject/aco"><FontAwesomeIcon icon={faGithub} /></a>
              </div>
            </div>
          </div>
        </div>}
        <div className="trade-menu-collapse" onClick={() => this.props.onCollapseClick()}>
          <FontAwesomeIcon icon={(this.props.advancedShown ? faChevronRight : faChevronLeft)}></FontAwesomeIcon>
        </div>
      </div>)
  }
}
TradeMenu.contextTypes = {
  assetsImages: PropTypes.object,
  web3: PropTypes.object
}
export default withRouter(TradeMenu)