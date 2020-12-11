import PropTypes from 'prop-types'
import { Component } from 'react'
import { isEmpty } from 'lodash'
import { ONE_SECOND, ONE_MINUTE, CHAIN_ID } from './constants.js'
import { getWeb3 } from './web3Methods'

const childContextTypes = {
  web3: PropTypes.shape({
    accounts: PropTypes.array,
    selectedAccount: PropTypes.string,
    network: PropTypes.string,
    networkId: PropTypes.string
  })
}

class Web3Provider extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      accounts: [],
      networkId: null,
      networkError: null
    }

    this.accountTimeout = null
    this.networkTimeout = null
    this.fetchAccounts = this.fetchAccounts.bind(this)
    this.fetchNetwork = this.fetchNetwork.bind(this)
  }
  
  getChildContext() {
    return {
      web3: {
        accounts: this.state.accounts,
        selectedAccount: this.state.accounts && this.state.accounts[0],
        networkId: this.state.networkId,
        validNetwork: this.state.networkId === CHAIN_ID,
        hasMetamask: window.web3 && window.web3.currentProvider
      }
    }
  }

  componentDidMount() {
    this.fetchNetwork().then(() => this.fetchAccounts())    
    this.networkPoll()
    this.accountPoll()    
  }

  accountPoll = () => {
    var self = this
    setTimeout(() => {
      self.fetchAccounts()
      self.accountPoll()
    }, ONE_SECOND)
  }

  networkPoll = () => {
    var self = this
    setTimeout(() => {
      self.fetchNetwork()
      self.networkPoll()
    }, ONE_MINUTE)
  }

  fetchAccounts = () => {
    this.getAccounts().then(ethAccounts => this.handleAccounts(ethAccounts))
  }

  handleAccounts = (accounts) => {
    const { onChangeAccount, onLoaded } = this.props
    let next = accounts && accounts.length > 0 && accounts[0]
    let curr = this.state.accounts && this.state.accounts.length > 0 && this.state.accounts[0]
    next = next && next.toLowerCase()
    curr = curr && curr.toLowerCase()
    const didChange = (curr !== next)

    if (isEmpty(this.state.accounts) && !isEmpty(accounts)) {
      this.setState({
        accountsError: null,
        accounts: accounts
      }, this.notifyStateChange)
    }

    if (didChange) {
      this.setState({
        accountsError: null,
        accounts: accounts
      }, this.notifyStateChange)

      if (typeof onChangeAccount === 'function' && this.state.networkId === CHAIN_ID) {
        onChangeAccount(next, curr)
      }
    }

    if (typeof onLoaded === 'function') {
      onLoaded()
    }    
  }

  fetchNetwork = () => {
    return new Promise((resolve, reject) => {    
      const { web3 } = window

      if (web3) {
        const isV1 = /^1/.test(web3.version)
        const getNetwork = isV1 ? web3.eth.net.getId : web3.version.getNetwork

        getNetwork((err, netId) => {
          if (err) {
            this.setState({
              networkError: err
            }, resolve)
          } else {
            if (netId !== this.state.networkId) {
              this.setState({
                networkError: null,
                networkId: netId
              }, resolve)
            }
          }
          
        })
      }
      else {
        resolve()
      }
    })
  }

  notifyStateChange = () => {
    if (this.props.stateChanged) {
      this.props.stateChanged()
    }
  }

  getAccounts = () => {
    return new Promise(function(resolve,reject){
      try {
        var metamaskAccountsAvailable = window.localStorage.getItem('METAMASK_ACCOUNTS_AVAILABLE')
        if (!window.web3 || !window.web3.currentProvider ||
         (metamaskAccountsAvailable && metamaskAccountsAvailable !== '1')) {
          resolve([])
        }
        else {
          const web3  = getWeb3()
          web3.eth.getAccounts().then(accounts => resolve(accounts))
        }
      } catch (e) {
        resolve([])
      }
    })    
  }

  render() {
    return this.props.children
  }
}

Web3Provider.childContextTypes = childContextTypes
export default Web3Provider