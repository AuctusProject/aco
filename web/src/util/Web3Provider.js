import PropTypes from 'prop-types'
import { Component } from 'react'
import { isEmpty } from 'lodash'
import { CHAIN_ID } from './constants.js'
import { connectWeb3Provider, getWeb3, hasWeb3Provider } from './web3Methods'

const childContextTypes = {
  web3: PropTypes.shape({
    accounts: PropTypes.array,
    selectedAccount: PropTypes.string,
    networkId: PropTypes.number,
    validNetwork: PropTypes.bool,
    hasWeb3Provider: PropTypes.bool
  })
}

class Web3Provider extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      accounts: [],
      networkId: null
    }
  }
  
  getChildContext() {
    return {
      web3: {
        accounts: this.state.accounts,
        selectedAccount: this.state.accounts && this.state.accounts[0],
        networkId: this.state.networkId,
        validNetwork: this.state.networkId === parseInt(CHAIN_ID),
        hasWeb3Provider: hasWeb3Provider()
      }
    }
  }

  componentDidMount() {
    window.addEventListener('web3-connect', this.handleConnect)
    window.addEventListener('web3-disconnect', this.handleDisconnect)
    window.addEventListener('web3-accounts', this.handleAccounts)
    window.addEventListener('web3-chain', this.handleChainId)
    let connector = window.localStorage.getItem('WEB3_LOGGED')
    if (connector) {
      connectWeb3Provider(connector)
    } else {
      this.props.onLoaded()
    }
  }

  componentWillUnmount() {
    window.removeEventListener('web3-connect', this.handleConnect)
    window.removeEventListener('web3-disconnect', this.handleDisconnect)
    window.removeEventListener('web3-accounts', this.handleAccounts)
    window.removeEventListener('web3-chain', this.handleChainId)
  }

  handleConnect = async () => {
    this.handleChainId(true)
    this.handleAccounts()
  }

  handleDisconnect = async () => {
    this.setState({
      accounts: [],
      networkId: null
    }, this.notifyStateChange)
  }

  handleAccounts = async () => {
    const { onChangeAccount, onLoaded } = this.props
    const accounts = await getWeb3().eth.getAccounts()
    let next = accounts && accounts.length > 0 && accounts[0]
    let curr = this.state.accounts && this.state.accounts.length > 0 && this.state.accounts[0]
    next = next && next.toLowerCase()
    curr = curr && curr.toLowerCase()
    const didChange = (curr !== next)

    if (isEmpty(this.state.accounts) && !isEmpty(accounts)) {
      this.setState({ accounts: accounts }, this.notifyStateChange)
    }

    if (didChange) {
      this.setState({ accounts: accounts }, this.notifyStateChange)

      if (typeof onChangeAccount === 'function' && this.state.networkId === parseInt(CHAIN_ID)) {
        onChangeAccount(next, curr)
      }
    }
    onLoaded()  
  }

  handleChainId = async (notNotify = null) => {
    const chainId = await getWeb3().eth.getChainId()
    this.setState({ networkId: chainId }, () => {
      if (!notNotify) {
        this.notifyStateChange()
      }
    })
  }

  notifyStateChange = () => {
    if (this.props.stateChanged) {
      this.props.stateChanged()
    }
  }

  render() {
    return this.props.children
  }
}

Web3Provider.childContextTypes = childContextTypes
export default Web3Provider