import PropTypes from 'prop-types'
import { Component } from 'react'
import { CHAIN_ID, wssInfuraAddress } from './constants'
import Web3 from 'web3'
import WalletConnect from "@walletconnect/client"
import QRCodeModal from "@walletconnect/qrcode-modal"
import detectEthereumProvider from '@metamask/detect-provider'
import { setWeb3 } from './web3Methods'

const infuraId = "86a7724fd0cb4e5dae62e8c2e474ced0"

const childContextTypes = {
  web3: PropTypes.shape({
    accounts: PropTypes.array,
    selectedAccount: PropTypes.string,
    networkId: PropTypes.number,
    validNetwork: PropTypes.bool,
    hasWeb3Provider: PropTypes.bool,
    isConnected: PropTypes.bool
  })
}

const INITIAL_STATE = {
  accounts: [],
  networkId: null,
  activeIndex: null,
  walletConnector: null,
  isConnected: false,
  web3: null,
  hasWeb3Provider: false
}

class Web3Provider extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = { ...INITIAL_STATE }
  }
  
  getChildContext() {
    return {
      web3: {
        selectedAccount: this.state.accounts && this.state.accounts[this.state.activeIndex],
        networkId: this.state.networkId,
        validNetwork: this.state.networkId === parseInt(CHAIN_ID),
        hasWeb3Provider: this.state.hasWeb3Provider,
        isConnected: this.state.isConnected
      }
    }
  }

  componentDidMount() {
    this.init()
  }

  componentWillUnmount() {
    if (this.state.web3 && this.state.web3.currentProvider && this.state.web3.currentProvider.removeAllListeners) {
      this.state.web3.currentProvider.removeAllListeners()
    }
  }

  componentDidUpdate = (prevProps) => {    
    if (this.props.connecting && this.props.connecting !== prevProps.connecting) {
      this.connect(this.props.connecting).then(() => this.props.connected(true)).catch((err) => {
        this.props.connected(false)
        console.error(err)
      })
    } 
    if (this.props.disconnecting && this.props.disconnecting !== prevProps.disconnecting) {
      this.disconnect()
      this.props.disconnected()
    }  
  }

  getWalletCachedSession = () => {
    const local = window.localStorage ? window.localStorage.getItem("walletconnect") : null
    let session = null
    if (local) {
      try {
        session = JSON.parse(local)
      } catch (error) {
        throw error
      }
    }
    return session
  }

  init = async () => {
    let connectorType = window.localStorage.getItem('WEB3_LOGGED')
    const web3provider = await this.getInjectedWeb3Provider()
    if (connectorType === "walletconnect") {
      const session = this.getWalletCachedSession()
      if (session) {
        const connector = new WalletConnect({session})
        this.setWalletConnect(connector, web3provider)
      } else {
        this.setDisconnect()
      }
    } else if (connectorType === "injected") {
      await this.setInjectedWeb3(web3provider)
    } else {
      const _web3 = this.getWeb3(web3provider)
      setWeb3(_web3)
      this.setState({web3: _web3, hasWeb3Provider: !!web3provider}, () => this.props.onLoaded())
    }
  }

  setWalletConnect = (walletConnector, web3Provider) => {
    walletConnector.on("connect", (error, payload) => {
      if (error) {
        throw error
      }
      console.log("EVENT", "wallet connect")
      const { accounts, chainId } = payload.params[0]
      this.setWeb3Data(accounts, chainId, true, this.getWeb3(web3Provider))
    })
    walletConnector.on("session_update", (error, payload) => {
      if (error) {
        throw error
      }
      console.log("EVENT", "wallet update")
      const { accounts, chainId } = payload.params[0]
      this.setWeb3Data(accounts, chainId)
    })
    walletConnector.on("disconnect", (error, payload) => {
      if (error) {
        throw error
      }
      console.log("EVENT", "wallet disconnect")
      this.setDisconnect()
    })
    if (walletConnector.connected) {
      const { accounts, chainId } = walletConnector
      this.setWeb3Data(accounts, chainId, true, this.getWeb3(web3Provider), walletConnector)
    }
  }

  setInjectedWeb3 = async (web3Provider) => {
    if (web3Provider) {
      web3Provider.on("connect", (chainId) => {
        this.state.web3.eth.getAccounts().then((accounts) => {
          this.setWeb3Data(accounts, parseInt(chainId), true)
        }).catch((err) => {
          throw err
        })
      })
      web3Provider.on("accountsChanged", (accounts) => {
        this.setWeb3Data(accounts, this.state.networkId)
      })
      web3Provider.on("chainChanged", (chainId) => {
        this.setWeb3Data(this.state.accounts, parseInt(chainId))
      })
      web3Provider.on("disconnect", (error) => {
        if (error) {
          throw error
        }
        this.setDisconnect()
      })
      const web3 = new Web3(web3Provider)
      const accounts = await web3Provider.request({ method: 'eth_accounts' })
      const chainId = await web3Provider.request({ method: 'eth_chainId' })
      this.setWeb3Data(accounts, parseInt(chainId), accounts && accounts.length > 0, web3)
    } else {
      const _web3 = this.getWeb3(web3Provider)
      setWeb3(_web3)
      this.setState({web3: _web3, hasWeb3Provider: false}, () => this.props.onLoaded())
    }
  }

  setDisconnect = () => {
    window.localStorage.removeItem('WEB3_LOGGED')
    this.setState({ ...INITIAL_STATE }, () => this.init())
  }

  setWeb3Data = (accounts, chainId, connected = null, web3 = null, walletConnector = null) => {
    let next = accounts && accounts.length > 0 && accounts[0]
    let curr = this.state.accounts && this.state.accounts.length > 0 && this.state.accounts[0]
    next = next && next.toLowerCase()
    curr = curr && curr.toLowerCase()
    const didChange = (next !== curr)
    const _web3 = web3 != null ? web3 : this.state.web3
    const _walletConnector = walletConnector != null ? walletConnector : this.state.walletConnector
    setWeb3(_web3, _walletConnector)
    this.setState({ 
      isConnected: connected != null ? connected : this.state.isConnected,
      web3: _web3,
      walletConnector: _walletConnector,
      hasWeb3Provider: true,
      accounts: accounts ? accounts : [],
      networkId: chainId !== null && chainId !== undefined ? chainId : null,
      activeIndex: accounts && accounts.length > 0 ? accounts.indexOf(accounts[0]) : null
     }, () => {
      if (this.props.stateChanged) {
        this.props.stateChanged()
      }
      if (didChange) {
        this.props.onChangeAccount(next, curr)
      }
      this.props.onLoaded()
    })
  }

  getInjectedWeb3Provider = async () => {
    let web3Provider = null
    try {
      web3Provider = await detectEthereumProvider()
      if (!web3Provider && window.web3 && window.web3.currentProvider) {
        web3Provider = window.web3.currentProvider
      }
    } catch(err) {
      console.error(err)
    }
    return web3Provider
  }

  getWeb3 = (web3Provider) => {
    return new Web3((web3Provider ? web3Provider : new Web3.providers.WebsocketProvider(wssInfuraAddress + infuraId)))
  }

  connect = async (type) => {
    if (type === "walletconnect") {
      const connector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org",
        qrcodeModal: QRCodeModal
      })
      this.setWalletConnect(connector)
      if (!connector.connected) {
        connector.createSession()
      }
    } else if (type === "injected") {
      const web3Provider = await this.getInjectedWeb3Provider()
      if (!web3Provider) {
        throw new Error("No injected web3 provider was found")
      }
      await this.setInjectedWeb3(web3Provider)
      const accounts = await web3Provider.request({ method: 'eth_requestAccounts' })
      const chainId = await web3Provider.request({ method: 'eth_chainId' })
      this.setWeb3Data(accounts, parseInt(chainId), true)
    } else {
      throw new Error("Invalid connection type")
    }
  }

  disconnect = () => {
    if (this.state.web3 && this.state.web3.currentProvider && this.state.web3.currentProvider.removeAllListeners) {
      this.state.web3.currentProvider.removeAllListeners()
    }
    if (this.state.walletConnector) {
      this.state.walletConnector.killSession()
    }
    this.setDisconnect()
  }

  render() {
    return this.props.children
  }
}

Web3Provider.childContextTypes = childContextTypes
export default Web3Provider