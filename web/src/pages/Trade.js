import './Trade.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import TradeMenu from '../partials/TradeMenu'
import TradeOptionsList, { TradeOptionsListLayoutMode } from '../partials/TradeOptionsList'
import { CHAIN_ID, getMarketDetails } from '../util/constants'
import { listOptions } from '../util/acoFactoryMethods'
import { balanceOf, getBalanceOfAsset } from '../util/acoTokenMethods'

export const ALL_OPTIONS_KEY = "all"

class Trade extends Component {
  constructor(props) {
    super(props)
    this.state = {options:null, balances:{}, orderBooks:{}, selectedExpiryTime: ALL_OPTIONS_KEY}
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
    else if (!this.props.match.params.tokenAddress && prevProps.match.params.tokenAddress) {
      this.onSelectOption(null)
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
    var tokenAddress = this.props.match.params.tokenAddress && this.props.match.params.tokenAddress.toLowerCase()
    for (let i = 0; i < options.length; i++) {
      if (options[i].acoToken.toLowerCase() === tokenAddress) {
        this.onSelectOption(options[i])
        return;
      }
    }
    this.onSelectOption(null)
  }

  loadOptionsData = () => {
    if (this.state.options) {
      this.loadBalances()
      this.loadOrderBook()
    }
  }

  loadOrderBook = () => {
    for (let i = 0; i < this.state.options.length; i++) {
      let option = this.state.options[i]
      var marketDetails = getMarketDetails(option)
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
    this.setState({selectedOption: option, selectedExpiryTime: option ? null : ALL_OPTIONS_KEY}, () => {
      if(option != null) {
        this.props.history.push('/trade/'+option.acoToken)
        window.TradeApp.unmount()
        window.TradeApp.mount(getMarketDetails(option))
      }
      else {
        this.props.history.push('/trade')
      }
    })
  }

  onSelectExpiryTime = (expiryTime) => {
    this.setState({selectedExpiryTime: expiryTime, selectedOption: null})
    this.props.history.push('/trade')
  }

  render() {
    return <div className="trade-page">
      {this.props.selectedPair && this.canLoad() && 
      <>
        <TradeMenu {...this.props} selectedOption={this.state.selectedOption} onSelectOption={this.onSelectOption} selectedExpiryTime={this.state.selectedExpiryTime} onSelectExpiryTime={this.onSelectExpiryTime} options={this.state.options} balances={this.state.balances}/>
        {!this.state.selectedOption && <TradeOptionsList {...this.props} mode={TradeOptionsListLayoutMode.Trade} selectedExpiryTime={this.state.selectedExpiryTime} selectedOption={this.state.selectedOption} onSelectOption={this.onSelectOption} options={this.state.options} balances={this.state.balances} orderBooks={this.state.orderBooks}></TradeOptionsList>}
        <div id="trade-app" className={!this.state.selectedOption ? "d-none" : ""}></div>
      </>}
    </div>
    
  }
}

Trade.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Trade)
