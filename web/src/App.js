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
import { getNetworkName, CHAIN_ID, getCurrentRoute, getPairIdFromRoute, isDarkMode } from './util/constants'
import { error } from './util/sweetalert'
import { getGasPrice } from './util/gasStationApi'
import ApiCoingeckoDataProvider from './util/ApiCoingeckoDataProvider'
import Vaults from './pages/Vaults'
import Otc from './pages/Otc'
import PoolDashboard from './partials/Pool/PoolDashboard'
import CreateOption from './pages/CreateOption'
import Farm from './pages/Farm'

class App extends Component {
  constructor() {
    super()
    this.state = {
      showSignIn: false,
      loading: true,
      selectedPair: null,
      accountToggle: false,
      toggleAdvancedTooltip: false,
      orderBooks:{},
      connecting: null,
      disconnecting: null,
      refreshWeb3: null
    }
    this.loadLayoutMode()
  }

  componentDidMount = () => {
    getGasPrice()
  }
  

  showSignInModal = (redirectUrl, context) => {
    if (context && context.web3 && context.web3.networkId && context.web3.hasWeb3Provider && !context.web3.validNetwork) {
      if (!this.state.refreshWeb3) {
        this.setState({refreshWeb3: true}, () => {
          let self = this
          setTimeout(() => {
            self.showSignInModal(redirectUrl, context)
          }, 1000)
        })
      } else {
        this.setState({refreshWeb3: null}, () => {
          error("Please connect to the "+ getNetworkName(CHAIN_ID) + ".", "Wrong Network")
        })
      }
    } else {
      this.setState({showSignIn: true, redirectUrl: redirectUrl, refreshWeb3: null})
    }    
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
      <Web3Provider refresh={this.state.refreshWeb3} connecting={this.state.connecting} connected={(ok) => this.onConnect(ok)} disconnecting={this.state.disconnecting} disconnected={() => this.setState({disconnecting: null})} onChangeAccount={this.onChangeAccount} onLoaded={this.onLoaded}>
        <ApiCoingeckoDataProvider>
          {this.state.loading ? 
          <div className="initial-loading">
            <img src={darkMode ? "/logo_white.svg" : "/logo.svg"} className="aco-logo" alt="" />
            <div className="mt-3">
              <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>&nbsp;
              Loading Auctus...
            </div>
          </div> :
          <main role="main">
            {showNavbar && <NavBar darkMode={darkMode} setLayoutMode={this.setLayoutMode} toggleAdvancedTooltip={this.state.toggleAdvancedTooltip} disconnect={() => this.setState({disconnecting: true})} signIn={this.showSignInModal} onPairsLoaded={this.onPairsLoaded} onPairSelected={this.onPairSelected} selectedPair={this.state.selectedPair}/>}
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
                  /> }
                />
                <Route 
                  path={`/advanced/exercise/:pair?/`}
                  render={ routeProps => <Exercise 
                    {...routeProps}
                    darkMode={darkMode}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={`/advanced/trade/:pair?/:tokenAddress?`}
                  render={ routeProps => <Trade 
                    {...routeProps}
                    darkMode={darkMode}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={`/pools/details/:poolAddress?`}
                  render={ routeProps => <PoolDashboard
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.showSignInModal}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={[`/buy/:pair?/:tokenAddress?`, `/write/:pair?/:tokenAddress?`, `/pools/:pair?/:tokenAddress?`, `/manage/:pair?/:tokenAddress?`]}
                  render={ routeProps => <Simple 
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.showSignInModal}
                    onPairSelected={this.onPairSelected} 
                    onPairsLoaded={this.onPairsLoaded}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                    toggleAdvancedTooltip={() => this.setState({toggleAdvancedTooltip: !this.state.toggleAdvancedTooltip})}
                  /> }
                />
                <Route 
                  path={[`/vaults`, `/advanced/vaults`]}
                  render={ routeProps => <Vaults
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.showSignInModal}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={[`/otc/trade/:orderId?`, `/otc/manage`]}
                  render={ routeProps => <Otc
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.showSignInModal}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={`/new-option`}
                  render={ routeProps => <CreateOption
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.showSignInModal}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={`/farm`}
                  render={ routeProps => <Farm
                    {...routeProps}
                    darkMode={darkMode}
                    signIn={this.showSignInModal}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Redirect to="/buy"></Redirect>
              </Switch>
              {showFooter && <Footer />}
            </div>
            {this.state.showSignIn && <MetamaskModal darkMode={darkMode} connecting={this.state.connecting} connect={(type) => this.setState({connecting: type})} onHide={(navigate) => this.onCloseSignIn(navigate)}/>}
          </main>}
        </ApiCoingeckoDataProvider>
      </Web3Provider>
    );
  }
}
export default withRouter(App)
