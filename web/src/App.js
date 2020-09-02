import './App.css'
import React, { Component } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import Home from './pages/Home'
import NavBar from './partials/NavBar'
import Footer from './partials/Footer'
import { withRouter } from 'react-router-dom'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Web3Provider from './util/Web3Provider'
import MetamaskModal from './partials/MetamaskModal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import Writer from './pages/Writer'
import Exercise from './pages/Exercise'
import Trade from './pages/Trade'
import Simple from './pages/Simple'
import { getNetworkName, CHAIN_ID, getMarketDetails, getCurrentRoute, getPairIdFromRoute } from './util/constants'
import { error } from './util/sweetalert'
import { getGasPrice } from './util/gasStationApi'
import ApiCoingeckoDataProvider from './util/ApiCoingeckoDataProvider'

class App extends Component {
  constructor() {
    super()
    this.state = {
      showSignIn: false,
      loading: true,
      selectedPair: null,
      accountToggle: false,
      toggleAdvancedTooltip: false,
      orderBooks:{}
    }
  }

  componentDidMount = () => {
    getGasPrice()
    window.TradeApp.setNetwork(parseInt(CHAIN_ID))
  }

  signOut() {
    window.localStorage.setItem('METAMASK_ACCOUNTS_AVAILABLE', '0')
  }

  showSignInModal = (redirectUrl, context) => {
    if (context && context.web3 && context.web3.hasMetamask && !context.web3.validNetwork) {
      error("Please connect to the "+ getNetworkName(CHAIN_ID) + ".", "Wrong Network")
    } else {
      this.setState({showSignIn: true, redirectUrl: redirectUrl})
    }    
  }

  onCloseSignIn = (navigate) => {
    this.setState({showSignIn: false})
  }

  onChangeAccount = (account, previousAccount) => {
    if (!account) {
      this.props.history.push('/')
    }
    else {
      if (!previousAccount) {
        if (this.state.redirectUrl) {
          this.props.history.push(this.state.redirectUrl) 
          this.setState({redirectUrl: null})
        }
      }
      this.setState({accountToggle:!this.state.accountToggle})
    }
  }

  onLoaded = () => {
    this.setState({loading: false})
  }

  onPairSelected = (pair) => {
    this.setState({selectedPair: pair})
    var route = getCurrentRoute(this.props.location)
    if (route) {
      var currentPairId = getPairIdFromRoute(this.props.location)
      if (pair && currentPairId !== pair.id) {
        this.props.history.push(route + pair.id)
      }      
    }    
  }

  onPairsLoaded = (pairs) => {
    this.setState({pairs: pairs})
  }

  loadOrderbookFromOptions = (options, includeWeb3) => {
    for (let i = 0; i < options.length; i++) {
      let option = options[i]
      this.loadOrderbookFromOption(option, includeWeb3)
    }
  }

  loadOrderbookFromOption = (option, includeWeb3) => {
    if (option) {
      var marketDetails = getMarketDetails(option)
      var baseToken = marketDetails.baseToken
      var quoteToken = marketDetails.quoteToken
      baseToken.address = baseToken.addresses[CHAIN_ID]
      quoteToken.address = quoteToken.addresses[CHAIN_ID]

      var orderbookFunction = includeWeb3 ? window.TradeApp.getAllOrdersAsUIOrders : 
      window.TradeApp.getAllOrdersAsUIOrdersWithoutOrdersInfo;

      orderbookFunction(baseToken, quoteToken).then(orderBook => {
        var orderBooks = this.state.orderBooks
        orderBooks[option.acoToken] = orderBook
        this.setState({ orderBooks: orderBooks })
      })
    }
  }

  render() {
    var showNavbar = window.location.pathname !== "/"
    var showFooter = window.location.pathname.indexOf("trade") < 0
    return (
      <Web3Provider onChangeAccount={this.onChangeAccount} onLoaded={this.onLoaded}>
        <ApiCoingeckoDataProvider>
          {this.state.loading ? 
          <div className="initial-loading">
            <img src="/logo.png" alt="Auctus Crypto Options" />
            <div className="mt-3">
              <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>&nbsp;
              Loading ACO...
            </div>
          </div> :
          <main role="main">
            {showNavbar && <NavBar toggleAdvancedTooltip={this.state.toggleAdvancedTooltip} signOut={() => this.signOut()} signIn={this.showSignInModal} onPairsLoaded={this.onPairsLoaded} onPairSelected={this.onPairSelected} selectedPair={this.state.selectedPair}/>}
            <div className={(showNavbar ? "app-content" : "")+(showFooter ? " footer-padding" : "")}>
              <Switch>
                <Route 
                  path={`/privacy`}
                  render={ routeProps => <Privacy {...routeProps} /> }
                />
                <Route 
                  path={`/terms`}
                  render={ routeProps => <Terms {...routeProps} /> }
                />
                <Route 
                  path={`/advanced/mint/:pair?/:tokenAddress?`}
                  render={ routeProps => <Writer 
                    {...routeProps}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={`/advanced/exercise/:pair?/`}
                  render={ routeProps => <Exercise 
                    {...routeProps}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={`/advanced/trade/:pair?/:tokenAddress?`}
                  render={ routeProps => <Trade 
                    {...routeProps}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                    orderBooks={this.state.orderBooks}
                    loadOrderbookFromOptions={this.loadOrderbookFromOptions}
                  /> }
                />                
                <Route 
                  path={[`/buy/:pair?/:tokenAddress?`, `/write/:pair?/:tokenAddress?`, `/manage/:pair?/:tokenAddress?`]}
                  render={ routeProps => <Simple 
                    {...routeProps}
                    signIn={this.showSignInModal}
                    onPairSelected={this.onPairSelected} 
                    onPairsLoaded={this.onPairsLoaded}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                    orderBooks={this.state.orderBooks}
                    toggleAdvancedTooltip={() => this.setState({toggleAdvancedTooltip: !this.state.toggleAdvancedTooltip})}
                    loadOrderbookFromOptions={this.loadOrderbookFromOptions}
                  /> }
                />
                <Route 
                  path={`/:pair?`}
                  exact={true}
                  render={ routeProps => <Home
                    {...routeProps}
                    onPairSelected={this.onPairSelected} 
                    selectedPair={this.state.selectedPair}
                    orderBooks={this.state.orderBooks}
                    loadOrderbookFromOptions={this.loadOrderbookFromOptions}
                    signIn={this.showSignInModal}
                  /> }
                />
                <Redirect to="/"></Redirect>
              </Switch>
              {showFooter && <Footer />}
            </div>
            {this.state.showSignIn && <MetamaskModal onHide={(navigate) => this.onCloseSignIn(navigate)}/>}
          </main>}
        </ApiCoingeckoDataProvider>
      </Web3Provider>
    );
  }
}
export default withRouter(App)
