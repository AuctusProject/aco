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
import ApiTickerProvider from './util/ApiTickerProvider'
import Trade from './pages/Trade'

class App extends Component {
  constructor() {
    super()
    this.state = {
      showSignIn: false,
      loading: true,
      selectedPair: null,
      accountToggle: false
    }
  }

  signOut() {
    window.localStorage.setItem('METAMASK_ACCOUNTS_AVAILABLE', '0')
  }

  showSignInModal = (redirectUrl) => {
    this.setState({showSignIn: true, redirectUrl: redirectUrl})
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
        this.props.history.push(this.state.redirectUrl)
        this.setState({redirectUrl: null})
      }
      this.setState({accountToggle:!this.state.accountToggle})
    }
  }
  
  needNavigate = () => {
    return window.location.pathname.indexOf("privacy") < 0 && 
      window.location.pathname.indexOf("terms") < 0 &&
      window.location.pathname.indexOf("exercise") < 0 &&
      window.location.pathname.indexOf("trade") < 0 &&
      window.location.pathname !== "/"
  }

  onLoaded = () => {
    this.setState({loading: false})
  }

  onPairSelected = (pair) => {
    this.setState({selectedPair: pair})
  }

  onPairsLoaded = (pairs) => {
    this.setState({pairs: pairs})
  }

  render() {
    var showNavbar = window.location.pathname !== "/"
    var showFooter = window.location.pathname.indexOf("trade") < 0
    return (
      <Web3Provider onChangeAccount={this.onChangeAccount} onLoaded={this.onLoaded}>
        <ApiTickerProvider pairs={this.state.pairs}>
          {this.state.loading ? 
          <div className="initial-loading">
            <img src="/logo.png" alt="Auctus Crypto Options" />
            <div className="mt-3">
              <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>&nbsp;
              Loading ACO...
            </div>
          </div> :
          <main role="main">
            {showNavbar && <NavBar signOut={() => this.signOut()} signIn={this.showSignInModal} onPairsLoaded={this.onPairsLoaded} onPairSelected={this.onPairSelected} selectedPair={this.state.selectedPair}/>}
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
                  path={`/write/`}
                  render={ routeProps => <Writer 
                    {...routeProps}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={`/exercise`}
                  render={ routeProps => <Exercise 
                    {...routeProps}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={`/trade/:tokenAddress?`}
                  render={ routeProps => <Trade 
                    {...routeProps}
                    selectedPair={this.state.selectedPair}
                    accountToggle={this.state.accountToggle}
                  /> }
                />
                <Route 
                  path={`/`}
                  exact={true}
                  render={ routeProps => <Home
                    {...routeProps}
                    signIn={this.showSignInModal}
                  /> }
                />
                <Redirect to="/"></Redirect>
              </Switch>
              {showFooter && <Footer />}
            </div>
            {this.state.showSignIn && <MetamaskModal onHide={(navigate) => this.onCloseSignIn(navigate)}/>}
          </main>}
        </ApiTickerProvider>
      </Web3Provider>
    );
  }
}
export default withRouter(App)
