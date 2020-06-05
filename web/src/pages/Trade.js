import './Trade.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import TradeMenu from '../partials/TradeMenu'
import TradeOptionsList from '../partials/TradeOptionsList'
import { CHAIN_ID } from '../util/constants'
import { listOptions } from '../util/acoFactoryMethods'
import { balanceOf, getBalanceOfAsset } from '../util/acoTokenMethods'


class Trade extends Component {
  constructor(props) {
    super(props)
    this.state = {options:null, balances:{}, orderBooks:{}}
  }
  
  componentDidMount = () => {
    if (!this.canLoad()) {
      this.props.history.push('/')
    }
    else {
      this.loadOptions()
      window.TradeApp.setNetwork(parseInt(CHAIN_ID))
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair) {
      this.loadOptions()
    }
    else if (this.props.accountToggle !== prevProps.accountToggle) {
      this.loadOptionsData()
    }
  }

  loadOptions = () => {
    if (this.props.selectedPair) {
      listOptions(this.props.selectedPair, null, true).then(options => {
        this.setState({options: options}, this.loadOptionsData)
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

  loadOptionsData = () => {
    this.loadBalances()
    this.loadOrderBook()
  }

  loadOrderBook = () => {
    for (let i = 0; i < this.state.options.length; i++) {
      let option = this.state.options[i]
      var marketDetails = this.getMarketDetails(option)
      var baseToken = marketDetails.baseToken
      var quoteToken = marketDetails.quoteToken
      baseToken.address = baseToken.addresses[CHAIN_ID]
      quoteToken.address = quoteToken.addresses[CHAIN_ID]
      window.TradeApp.getAllOrdersAsUIOrders(baseToken, quoteToken).then(orderBook => {
        var orderBooks = this.state.orderBooks
        orderBooks[option.acoToken] = orderBook
        this.setState({orderBooks: orderBooks})
      })
    }
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
    return <div className="trade-page">
      {this.props.selectedPair && this.canLoad() && 
      <>
        <TradeMenu {...this.props} selectedOption={this.state.selectedOption} onSelectOption={this.onSelectOption} options={this.state.options} balances={this.state.balances}/>
        {!this.state.selectedOption && <TradeOptionsList {...this.props} selectedOption={this.state.selectedOption} onSelectOption={this.onSelectOption} options={this.state.options} balances={this.state.balances} orderBooks={this.state.orderBooks}></TradeOptionsList>}
        {this.state.selectedOption && <div id="trade-app"></div>}
      </>}
    </div>
    
  }
}

Trade.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Trade)