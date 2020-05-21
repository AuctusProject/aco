import './TradeMenu.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { fromDecimals, OPTION_TYPES } from '../util/constants'
import OptionBadge from './OptionBadge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons'
import { NavLink } from 'react-router-dom'

class TradeMenu extends Component {
  onSelectOption = (option) => {
    this.props.onSelectOption(option)
  }

  groupBy = (xs, key) => {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  }

  render() {
    var pair = this.props.selectedPair    
    var grouppedOptions = this.props.options ? this.groupBy(this.props.options, "isCall") : {}
    var pairTitle = pair.underlyingSymbol + pair.strikeAssetSymbol
    return (
      <div className="trade-menu">
        <div className="trade-menu-pair-balance-info">
          <div className="trade-menu-balance-title">BALANCE</div>
          <div className="pair-balance-item">
            <div className="trade-menu-pair-symbol">{pair.underlyingSymbol}</div>
            <div className="trade-menu-pair-balance">{this.props.balances[pair.underlying] ? fromDecimals(this.props.balances[pair.underlying], pair.underlyingInfo.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</div>
          </div>
          <div className="pair-balance-item">
            <div className="trade-menu-pair-symbol">{pair.strikeAssetSymbol}</div>
            <div className="trade-menu-pair-balance">{this.props.balances[pair.strikeAsset] ? fromDecimals(this.props.balances[pair.strikeAsset], pair.strikeAssetInfo.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</div>
          </div>
        </div>    
        <div className="trade-menu-content">
          <div>
            {this.props.selectedOption && grouppedOptions && <>
              <div className="trade-menu-pair-title">{pairTitle} options</div>
              {Object.values(OPTION_TYPES).map(optionType => (
              <div key={optionType.id} className="option-type-wrapper">
                <OptionBadge isCall={(optionType.id === 1)}/>
                {grouppedOptions[(optionType.id === 1)] && grouppedOptions[(optionType.id === 1)].map(option => (
                  <div key={option.acoToken} className={"option-balance-item "+(this.props.selectedOption === option ? "active" : "")} onClick={() => this.onSelectOption(option)}>
                    <div className="option-symbol">{option.acoTokenInfo.symbol}</div>
                    <div className="option-balance">{this.props.balances[option.acoToken] ? fromDecimals(this.props.balances[option.acoToken], option.underlyingInfo.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</div>
                  </div>
                ))}
                {!grouppedOptions[(optionType.id === 1)] && <div className="empty-options-message">No {optionType.name} options available for {pairTitle}</div>}
              </div>))}
            </>}
          </div>
          <div className="trade-menu-footer">
            <div className="trade-menu-footer-links">
              <NavLink to="/terms">Terms</NavLink>
              <NavLink to="/privacy">Privacy Policy</NavLink>
              <a target="_blank" rel="noopener noreferrer" href="https://docs.aco.finance/faq">FAQ</a>
              <a target="_blank" rel="noopener noreferrer" href="https://docs.aco.finance/">DOCS</a>
            </div>
            <div className="trade-menu-footer-media">
              <div>© 2020 ACO</div>
              <div>
                <a rel="noopener noreferrer" href="mailto:contact@aco.finance"><FontAwesomeIcon icon={faEnvelope} /></a>
                <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/AcoFinance"><FontAwesomeIcon icon={faTwitter} /></a>
                <a target="_blank" rel="noopener noreferrer" href="https://discord.gg/9JqeMxs"><FontAwesomeIcon icon={faDiscord} /></a>
                <a target="_blank" rel="noopener noreferrer" href="https://github.com/AuctusProject/aco"><FontAwesomeIcon icon={faGithub} /></a>
              </div>
            </div>
          </div>
        </div>
      </div>)
  }
}
TradeMenu.contextTypes = {
  web3: PropTypes.object
}
export default TradeMenu