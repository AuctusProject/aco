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
import Trade from './pages/Trade'
import Simple from './pages/Simple'
import { getCurrentRoute, getModeView, getPairIdFromRoute, getSlippageConfig, ModeView, setModeView, setSlippageConfig } from './util/constants'
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
import Pools from './pages/Pools'
import { menuConfig } from './util/network'

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
      toggleSimpleTooltip: false,
      orderBooks:{},
      connecting: null,
      disconnecting: null,
      refreshWeb3: null,
      slippage: getSlippageConfig(),
      modeView: getModeView(),
      pairs: null
    }
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
    if (!previousAccount) {
      if (this.state.redirectUrl) {
        this.props.history.push(this.state.redirectUrl) 
        this.setState({redirectUrl: null})
      }
    }
    this.setState({accountToggle:!this.state.accountToggle})  
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

  setModeView = (modeView) => {
    this.setState({modeView: modeView})
    setModeView(modeView)
  }

  onConnect = (ok) => {
    this.setState({connecting: null, showSignIn: !ok})
  }

  render() {
    var showNavbar = window.location.pathname !== "/"
    var showFooter = window.location.pathname.indexOf("advanced") < 0
    var menuConfigData = menuConfig()
    var simplePaths = "/(buy|manage"
    if (menuConfigData.hasAdvanced) {
      simplePaths += "|write"
    }
    return (
      <Web3Provider refresh={this.state.refreshWeb3} connecting={this.state.connecting} connected={(ok) => this.onConnect(ok)} disconnecting={this.state.disconnecting} disconnected={() => this.setState({disconnecting: null})} onChangeAccount={this.onChangeAccount} onChangeNetwork={this.onChangeNetwork} onLoaded={this.onLoaded}>
        <ApiCoingeckoDataProvider networkToggle={this.state.networkToggle}>
          {this.state.loading ? 
          <div className="initial-loading">
            <img src="/logo_white.svg" className="aco-logo" alt="" />
            <div className="mt-3">
              <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>&nbsp;
              Loading Auctus...
            </div>
          </div> :
          <main role="main">
            {showNavbar && <NavBar toggleAdvancedTooltip={this.state.toggleAdvancedTooltip} toggleSimpleTooltip={this.state.toggleSimpleTooltip} disconnect={() => this.setState({disconnecting: true})} signIn={this.setSignIn} slippage={this.state.slippage} setSlippage={this.setSlippage} modeView={this.state.modeView} setModeView={this.setModeView}/>}
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
                {menuConfigData.hasAdvanced && <Route 
                  path={`/advanced/(trade|mint|exercise)/:pair?/:tokenAddress?`}
                  render={ routeProps => <Trade 
                    {...routeProps}
                    onPairSelected={this.onPairSelected}
                    onPairsLoaded={this.onPairsLoaded}
                    pairs={this.state.pairs}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    slippage={this.state.slippage} setSlippage={this.setSlippage}
                    signIn={this.setSignIn}
                    modeView={this.state.modeView} 
                    setModeView={this.setModeView}
                    toggleSimpleTooltip={() => this.setState({toggleSimpleTooltip: !this.state.toggleSimpleTooltip})}
                  />}
                />}
                <Route 
                  path={`/pools/details/:poolAddress?`}
                  render={ routeProps => <PoolDashboard
                    {...routeProps}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    slippage={this.state.slippage} setSlippage={this.setSlippage}
                  /> }
                />
                <Route 
                  path={`/pools/`}
                  render={ routeProps => <Pools
                    {...routeProps}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    slippage={this.state.slippage} setSlippage={this.setSlippage}
                  /> }
                />                
                <Route 
                  path={simplePaths+")/:pair?/:tokenAddress?"}
                  render={ routeProps => <Simple 
                    {...routeProps}
                    signIn={this.setSignIn}
                    onPairSelected={this.onPairSelected}
                    onPairsLoaded={this.onPairsLoaded}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    toggleAdvancedTooltip={() => this.setState({toggleAdvancedTooltip: !this.state.toggleAdvancedTooltip})}
                    slippage={this.state.slippage} setSlippage={this.setSlippage}
                    modeView={this.state.modeView} 
                    setModeView={this.setModeView}
                  /> }
                />
                {menuConfigData.hasVaults && <Route 
                  path={`/vaults`}
                  render={ routeProps => <Vaults
                    {...routeProps}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    slippage={this.state.slippage} setSlippage={this.setSlippage}
                  /> }
                />}
                {menuConfigData.hasOtc && <Route 
                  path={`/otc/(trade|manage)/:orderId?`}
                  render={ routeProps => <Otc
                    {...routeProps}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                  /> }
                />}
                {menuConfigData.hasCreateOption && <Route 
                  path={`/new-option`}
                  render={ routeProps => <CreateOption
                    {...routeProps}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                    modeView={this.state.modeView}
                  /> }
                />}
                {menuConfigData.hasFarm && <Route 
                  path={`/farm`}
                  render={ routeProps => <Farm
                    {...routeProps}
                    signIn={this.setSignIn}
                    accountToggle={this.state.accountToggle}
                    networkToggle={this.state.networkToggle}
                  /> }
                />}
                <Redirect to={menuConfigData.hasAdvanced && this.state.modeView === ModeView.Advanced ? "/advanced/trade" : "/buy"}></Redirect>
              </Switch>
              {showFooter && <Footer />}
            </div>
            {this.state.showSignIn && <MetamaskModal connecting={this.state.connecting} connect={(type) => this.setState({connecting: type})} onHide={(navigate) => this.onCloseSignIn(navigate)}/>}
            {this.state.showSelectNetwork && <NetworkModal onHide={() => this.onCloseNetworkModal()}/>}
          </main>}
        </ApiCoingeckoDataProvider>
      </Web3Provider>
    );
  }
}
export default withRouter(App)
