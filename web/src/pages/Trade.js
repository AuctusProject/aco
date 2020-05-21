import './Trade.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import TradeMenu from '../partials/TradeMenu'
import { CHAIN_ID, formatDate, fromDecimals } from '../util/constants'
import { listOptions } from '../util/acoFactoryMethods'
import { balanceOf, getBalanceOfAsset, getOptionFormattedPrice } from '../util/acoTokenMethods'
import OptionBadge from '../partials/OptionBadge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

class Trade extends Component {
  constructor(props) {
    super(props)
    this.state = {options:null, balances:{}}
  }
  
  componentDidMount = () => {
    if (!this.canLoad()) {
      this.props.history.push('/')
    }
    else {
      this.loadOptions()
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair) {
      this.loadOptions()
    }
  }

  loadOptions = () => {
    if (this.props.selectedPair) {
      listOptions(this.props.selectedPair, null, true).then(options => {
        this.setState({options: options}, this.loadBalances)
        this.selectOption(options)
      })
    }
  }

  selectOption = (options) => {
    for (let i = 0; i < options.length; i++) {
      if (options[i].acoToken === this.props.match.params.tokenAddress) {
        this.onSelectOption(options[i])
        return;
      }
    }
    this.onSelectOption(null)
  }

  loadBalances = () => {
    for (let i = 0; i < this.state.options.length; i++) {
      let option = this.state.options[i]
      balanceOf(option, this.context.web3.selectedAccount).then(balance => {
        var balances = this.state.balances
        balances[option.acoToken] = balance
        this.setState({balances: balances})
      })
    }

    getBalanceOfAsset(this.props.selectedPair.underlying, this.context.web3.selectedAccount).then(balance => {
      var balances = this.state.balances
      balances[this.props.selectedPair.underlying] = balance
      this.setState({balances: balances})
    })

    getBalanceOfAsset(this.props.selectedPair.strikeAsset, this.context.web3.selectedAccount).then(balance => {
      var balances = this.state.balances
      balances[this.props.selectedPair.strikeAsset] = balance
      this.setState({balances: balances})
    })
  }

  canLoad = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  componentWillUnmount = () => {
    if (window.TradeApp && this.state.selectedOption) {
      window.TradeApp.unmount()
    }
  }

  onSelectOption = (option) => {
    this.setState({selectedOption: option}, () => {
      if(option != null) {
        this.props.history.push('/trade/'+option.acoToken)
        window.TradeApp.unmount()
        window.TradeApp.setNetwork(parseInt(CHAIN_ID))
        window.TradeApp.mount(this.getMarketDetails(option))
      }
      else {
        this.props.history.push('/trade')
      }
    })    
  }

  getMarketDetails = (selectedOption) => {
    return {baseToken: {
        "decimals": parseInt(selectedOption.underlyingInfo.decimals),
        "symbol": selectedOption.acoTokenInfo.symbol,
        "name":  selectedOption.acoTokenInfo.name,
        "icon": null,
        "primaryColor": null,
        "expiryTime": selectedOption.expiryTime,
        "addresses": {[CHAIN_ID]:selectedOption.acoTokenInfo.address},
      },
      quoteToken: {
        "decimals": parseInt(selectedOption.strikeAssetInfo.decimals),
        "symbol": selectedOption.strikeAssetInfo.symbol,
        "name":  selectedOption.strikeAssetInfo.name,
        "icon": null,
        "primaryColor": null,
        "expiryTime": null,
        "addresses": {[CHAIN_ID]:selectedOption.strikeAssetInfo.address},
      }
    }
  }

  render() {
    var pair = this.props.selectedPair
    var pairTitle = pair ? (pair.underlyingSymbol + pair.strikeAssetSymbol) : ""    
    return <div className="trade-page">
      {this.props.selectedPair && this.canLoad() && 
      <>
        <TradeMenu {...this.props} selectedOption={this.state.selectedOption} onSelectOption={this.onSelectOption} options={this.state.options} balances={this.state.balances}/>
        {!this.state.selectedOption && 
        <div className="trade-options-list py-5">          
          <div className="page-title">{pairTitle} options</div>
          <table className="aco-table mx-auto">
            <thead>
              <tr>
                <th>TYPE</th>
                <th>SYMBOL</th>
                <th>STRIKE</th>
                <th>EXPIRATION</th>
                <th>BALANCE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(!this.state.options || this.state.options.length === 0) && 
                <tr>
                  {!this.state.options && <td colSpan="6">Loading...</td>}
                  {this.state.options && this.state.options.length === 0 && <td colSpan="6">No options for {this.props.selectedPair.underlyingSymbol}{this.props.selectedPair.strikeAssetSymbol}</td>}
                </tr>
              }
              {this.state.options && this.state.options.map(option => 
              <tr key={option.acoToken}>
                <td><OptionBadge isCall={option.isCall}></OptionBadge></td>
                <td>{option.acoTokenInfo.symbol}</td>
                <td>{getOptionFormattedPrice(option)}</td>
                <td>{formatDate(option.expiryTime)}</td>
                <td>{this.state.balances[option.acoToken] ? fromDecimals(this.state.balances[option.acoToken], option.underlyingInfo.decimals) : <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>}</td>
                <td>
                  <div className="action-btn" onClick={() => this.onSelectOption(option)}>TRADE</div>
                </td>
              </tr>)}
            </tbody>
          </table>   
        </div>
        }
        {this.state.selectedOption && <div id="trade-app"></div>}
      </>}
    </div>
    
  }
}

Trade.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Trade)