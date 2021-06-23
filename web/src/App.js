import './App.css'
import React, { Component } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
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
import { getCurrentRoute, getPairIdFromRoute, isDarkMode, getSlippageConfig, setSlippageConfig } from './util/constants'
import { getGasPrice } from './util/gasStationApi'
import ApiCoingeckoDataProvider from './util/ApiCoingeckoDataProvider'
import Vaults from './pages/Vaults'
import Otc from './pages/Otc'
import PoolDashboard from './partials/Pool/PoolDashboard'
import CreateOption from './pages/CreateOption'
import Farm from './pages/Farm'
import { clearData } from './util/dataController'
import { clearOrderbook } from './util/acoSwapUtil'
import { resetZrxRateLimit } from './util/Zrx/zrxApi'
import { resetZrxData } from './util/Zrx/zrxWeb3'
import { resetOptions } from './util/contractHelpers/acoFactoryMethods'
import { resetPools } from './util/contractHelpers/acoPoolFactoryMethods'
import { resetPoolsData } from './util/contractHelpers/acoPoolMethodsv5'
import { resetRewardData } from './util/contractHelpers/acoRewardsMethods'
import { resetSwapPairData } from './util/contractHelpers/uniswapPairMethods'
import NetworkModal from './partials/NetworkModal'
import { clearBaseApiData } from './util/baseApi'
import { clearApiData } from './util/acoApi'

class App extends Component {
  constructor() {
    super()
    this.state = {
      showSignIn: false,
      showSelectNetwork: false,
      loading: true,
      selectedPair: null,
      accountToggle: false,
      networkToggle: false,
      toggleAdvancedTooltip: false,
      orderBooks:{},
      connecting: null,
      disconnecting: null,
      refreshWeb3: null,
      slippage: getSlippageConfig()
    }
    this.loadLayoutMode()
  }

  componentDidMount = () => {
    getGasPrice()
  }

  setSlippage = (slippage) => {
    setSlippageConfig(slippage)
    this.setState({slippage: slippage})
  }  

  setSignIn = (redirectUrl, context) => {
    let isConnected = context && context.web3 && context.web3.hasWeb3Provider && context.web3.selectedAccount
    if (isConnected) {
      if (!context.web3.validNetwork) {
        this.handleInvalidNetwork(redirectUrl)
      } else {
        this.showNetworkModal()
      }
    } else {
      this.showSignInModal(redirectUrl)
    }   
  }

  showSignInModal = (redirectUrl) => {
    this.setState({showSignIn: true, redirectUrl: redirectUrl, refreshWeb3: null})
  }

  showNetworkModal = () => {
    this.setState({showSelectNetwork: true, refreshWeb3: null})
  }

  handleInvalidNetwork(redirectUrl) {
    if (!this.state.refreshWeb3) {
      this.setState({refreshWeb3: {redirectUrl}})
    } else {
      this.setState({refreshWeb3: null, showSelectNetwork: true})
    }
  }

  onCloseNetworkModal = () => {
    this.setState({showSelectNetwork: false})
  }

  onCloseSignIn = (navigate) => {
    this.setState({showSignIn: false})
  }

  onChangeAccount = (account, previousAccount) => {
    if (!account) {
      if (window.location.pathname.indexOf("advanced") >= 0) {
        this.props.history.push('/')
      }
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

  onChangeNetwork = (chainId, previousChainId) => {
    clearBaseApiData()
    clearApiData()
    clearData()
    clearOrderbook()
    resetZrxRateLimit()
    resetZrxData()
    resetOptions()
    resetPools()
    resetPoolsData()
    resetRewardData()
    resetSwapPairData()
    getGasPrice(true)
    this.setState({networkToggle:!this.state.networkToggle})
  }

  onLoaded = (context) => {
    this.setState({loading: false}, () => {
      if (this.state.refreshWeb3) {
        this.setSignIn(this.state.refreshWeb3.redirectUrl, context)
      }
    })
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

  setLayoutMode = (isDarkMode) => {
    if (isDarkMode) {
      if (!document.body.classList.contains("dark-mode")) {
        document.body.classList.remove('light-mode')
        document.body.classList.add('dark-mode')
      }
      window.localStorage.setItem('LAYOUT_MODE', '1')
    }
    else {
      if (!document.body.classList.contains("light-mode")) {
        document.body.classList.remove('dark-mode')
        document.body.classList.add('light-mode')
      }
      window.localStorage.setItem('LAYOUT_MODE', '0')
    }
  }

  loadLayoutMode = () => {
    this.setLayoutMode(isDarkMode())
  }

  onConnect = (ok) => {
    this.setState({connecting: null, showSignIn: !ok})
  }

  render() {
    var showNavbar = window.location.pathname !== "/"
    var showFooter = window.location.pathname.indexOf("advanced/trade") < 0
    var darkMode = isDarkMode()
    return (
      <Web3Provider refresh={this.state.refreshWeb3} connecting={this.state.connecting} connected={(ok) => this.onConnect(ok)} disconnecting={this.state.disconnecting} disconnected={() => this.setState({disconnecting: null})} onChangeAccount={this.onChangeAccount} onChangeNetwork={this.onChangeNetwork} onLoaded={this.onLoaded}>
        <ApiCoingeckoDataProvider networkToggle={this.state.networkToggle}>
          {this.state.loading ? 
          <div className="initial-loading">
            <img src={darkMode ? "/logo_white.svg" : "/logo.svg"} className="aco-logo" alt="" />
            <div className="mt-3">
              <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>&nbsp;
              Loading Auctus...
            </div>
          </div> :
          <main role="main">
            {showNavbar && <NavBar darkMode={darkMode} setLayoutMode={this.setLayoutMode} toggleAdvancedTooltip={this.state.toggleAdvancedTooltip} disconnect={() => this.setState({disconnecting: true})} signIn={this.setSignIn} onPairsLoaded={this.onPairsLoaded} onPairSelected={this.onPairSelected} selectedPair={this.state.selectedPair} slippage={this.state.slippage} setSlippage={this.setSlippage}/>}
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
                    darkMode={darkMode}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                  /> }
                />
                <Route 
                  path={`/advanced/exercise/:pair?/`}
                  render={ routeProps => <Exercise 
                    {...routeProps}
                    darkMode={darkMode}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                  /> }
                />
                <Route 
                  path={`/advanced/trade/:pair?/:tokenAddress?`}
                  render={ routeProps => <Trade 
                    {...routeProps}
                    darkMode={darkMode}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    slippage={this.state.slippage} setSlippage={this.setSlippage}
                  /> }
                />
                <Route 
                  path={`/pools/details/:poolAddress?`}
                  render={ routeProps => <PoolDashboard
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    slippage={this.state.slippage} setSlippage={this.setSlippage}
                  /> }
                />
                <Route 
                  path={[`/buy/:pair?/:tokenAddress?`, `/write/:pair?/:tokenAddress?`, `/pools/:pair?/:tokenAddress?`, `/manage/:pair?/:tokenAddress?`]}
                  render={ routeProps => <Simple 
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.setSignIn}
                    onPairSelected={this.onPairSelected} 
                    onPairsLoaded={this.onPairsLoaded}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    toggleAdvancedTooltip={() => this.setState({toggleAdvancedTooltip: !this.state.toggleAdvancedTooltip})}
                    slippage={this.state.slippage} setSlippage={this.setSlippage}
                  /> }
                />
                <Route 
                  path={[`/vaults`, `/advanced/vaults`]}
                  render={ routeProps => <Vaults
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    slippage={this.state.slippage} setSlippage={this.setSlippage}
                  /> }
                />
                <Route 
                  path={[`/otc/trade/:orderId?`, `/otc/manage`]}
                  render={ routeProps => <Otc
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                  /> }
                />
                <Route 
                  path={`/new-option`}
                  render={ routeProps => <CreateOption
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                  /> }
                />
                <Route 
                  path={`/farm`}
                  render={ routeProps => <Farm
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                  /> }
                />
                <Redirect to="/buy"></Redirect>
              </Switch>
              {showFooter && <Footer />}
            </div>
            {this.state.showSignIn && <MetamaskModal darkMode={darkMode} connecting={this.state.connecting} connect={(type) => this.setState({connecting: type})} onHide={(navigate) => this.onCloseSignIn(navigate)}/>}
            {this.state.showSelectNetwork && <NetworkModal onHide={() => this.onCloseNetworkModal()}/>}
          </main>}
        </ApiCoingeckoDataProvider>
      </Web3Provider>
    );
  }
}
export default withRouter(App)
