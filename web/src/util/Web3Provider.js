import PropTypes from 'prop-types'
import { Component } from 'react'
import { CHAIN_ID, wssInfuraAddress } from './constants'
import Web3 from 'web3'
import WalletConnect from "@walletconnect/client"
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal"
import detectEthereumProvider from '@metamask/detect-provider'
import { setWeb3 } from './web3Methods'

const infuraId = "86a7724fd0cb4e5dae62e8c2e474ced0"

const childContextTypes = {
  web3: PropTypes.shape({
    selectedAccount: PropTypes.string,
    networkId: PropTypes.number,
    validNetwork: PropTypes.bool,
    hasWeb3Provider: PropTypes.bool,
    name: PropTypes.string
  })
}

class Web3Provider extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = { 
      accounts: [],
      networkId: null,
      activeIndex: null,
      walletConnector: null,
      web3: null,
      hasWeb3Provider: false,
      name: null
    }
  }
  
  getChildContext() {
    return {
      web3: {
        selectedAccount: this.state.accounts && this.state.accounts.length > 0 ? this.state.accounts[this.state.activeIndex] : null,
        networkId: this.state.networkId,
        validNetwork: this.state.networkId === parseInt(CHAIN_ID),
        hasWeb3Provider: this.state.hasWeb3Provider,
        name: this.state.name
      }
    }
  }

  componentDidMount() {
    this.init()
  }

  componentWillUnmount() {
    this.unsubscribeEvents()
  }

  componentDidUpdate = (prevProps) => {    
    if (this.props.connecting && this.props.connecting !== prevProps.connecting) {
      this.connect(this.props.connecting).then(() => {
        this.props.connected(true)
      }).catch((err) => {
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
    const local = window && window.localStorage ? window.localStorage.getItem("walletconnect") : null
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
    let connectorType = window && window.localStorage ? window.localStorage.getItem('WEB3_LOGGED') : null
    const web3Provider = await this.getInjectedWeb3Provider()
    if (connectorType === "walletconnect") {
      const session = this.getWalletCachedSession()
      if (session) {
        const connector = new WalletConnect({session})
        if (connector.connected) {
          this.setWalletConnect(connector, web3Provider)
        } else {
          await this.killWalletConnectorSession(connector)
          await this.disconnect(web3Provider)
        }
      } else {
        await this.disconnect(web3Provider)
      }
    } else if (connectorType === "injected") {
      await this.setInjectedWeb3(web3Provider)
    } else {
      const _web3 = this.getWeb3(web3Provider)
      const chainId = await this.getChainId(web3Provider)
      setWeb3(_web3, null)
      this.setState({networkId: chainId, web3: _web3, hasWeb3Provider: !!web3Provider, name: this.getProviderName(web3Provider)}, () => this.props.onLoaded())
    }
  }

  getProviderName = (web3Provider) => {
    if (web3Provider) {
      if (web3Provider.isMetaMask) {
        return "Metamask"
      } else {
        return "Web3 Provider"
      }
    }
    return null
  }

  setWalletConnect = (walletConnector, web3Provider) => {
    walletConnector.on("connect", (error, payload) => {
      if (error) {
        throw error
      }
      WalletConnectQRCodeModal.close()
      console.log("EVENT", "wallet connect")
      const { accounts, chainId } = payload.params[0]
      this.setWeb3Data(accounts, chainId)
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
      this.disconnect()
    })
    const _web3 = this.getWeb3(web3Provider)
    if (walletConnector.connected) {
      const { accounts, chainId } = walletConnector
      this.setWeb3Data(accounts, chainId, "Wallet Connect", _web3, walletConnector)
    } else {
      this.setWeb3Data([], null, "Wallet Connect", _web3, walletConnector)
    }
  }

  setInjectedWeb3Events = (web3Provider) => {
    if (web3Provider) {
      web3Provider.on("connect", (chainId) => {
        this.state.web3.eth.getAccounts().then((accounts) => {
          this.setWeb3Data(accounts, parseInt(chainId))
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
        this.disconnect()
      })
    }
  }

  setInjectedWeb3 = async (web3Provider) => {
    if (web3Provider) {
      this.setInjectedWeb3Events()
      const _web3 = new Web3(web3Provider)
      let accounts = []
      if (web3Provider.request) {
        accounts = await web3Provider.request({ method: 'eth_accounts' })
      } else {
        accounts = await _web3.eth.getAccounts()
      }
      const chainId = await this.getChainId(web3Provider)
      this.setWeb3Data(accounts, chainId, this.getProviderName(web3Provider), _web3)
    } else {
      const _web3 = this.getWeb3(web3Provider)
      const chainId = await this.getChainId(web3Provider)
      setWeb3(_web3, null)
      this.setState({web3: _web3, hasWeb3Provider: false, networkId: chainId, name: null}, () => this.props.onLoaded())
    }
  }

  getChainId = async (web3Provider) => {
    let chainId = null
    if (web3Provider) {
      try {
        if (web3Provider.request) {
          chainId = await web3Provider.request({ method: 'eth_chainId' })
        } else {
          chainId = await web3Provider.eth.net.getId()
        }
      } catch(err) {
        console.error(err)
      }
    }
    return chainId ? parseInt(chainId) : null
  }

  setWeb3Data = (accounts, chainId, name = null, web3 = null, walletConnector = null) => {
    let next = accounts && accounts.length > 0 ? accounts[0] : null
    let curr = this.state.accounts && this.state.accounts.length > 0 ? this.state.accounts[0] : null
    next = next ? next.toLowerCase() : null
    curr = curr ? curr.toLowerCase() : null
    const didChange = (next !== curr)
    const _web3 = web3 != null ? web3 : this.state.web3
    const _walletConnector = walletConnector != null ? walletConnector : this.state.walletConnector
    setWeb3(_web3, _walletConnector)
    this.setState({ 
      web3: _web3,
      walletConnector: _walletConnector,
      hasWeb3Provider: true,
      accounts: accounts ? accounts : [],
      networkId: chainId !== null && chainId !== undefined ? chainId : null,
      name: name !== null && name !== undefined ? name : this.state.name,
      activeIndex: accounts && accounts.length > 0 ? accounts.indexOf(accounts[0]) : null
     }, () => {
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
    const web3Provider = await this.getInjectedWeb3Provider()
    if (type === "walletconnect") {
      const connector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org"
      })
      if (!connector.connected) {
        await connector.createSession()
        WalletConnectQRCodeModal.open(connector.uri, () => {
          this.disconnect(web3Provider)
        })
      }
      this.setWalletConnect(connector, web3Provider)
      if (window && window.localStorage) {
        window.localStorage.setItem('WEB3_LOGGED', type)
      }
    } else if (type === "injected") {
      if (!web3Provider) {
        throw new Error("No injected web3 provider was found")
      }
      this.setInjectedWeb3Events(web3Provider)
      const chainId = await this.getChainId(web3Provider)
      let accounts = []
      try {
        if (web3Provider.request) {
          accounts = await web3Provider.request({ method: 'eth_requestAccounts' })
        } else if (web3Provider.enable) {
          accounts = await web3Provider.enable()
        } else {
          throw new Error("Cannot connect on Injected Web3")
        }
      } catch(err) {
        console.error(err)
        this.unsubscribeEvents()
        return
      }
      if (window && window.localStorage) {
        window.localStorage.setItem('WEB3_LOGGED', type)
      }
      this.setWeb3Data(accounts, chainId, this.getProviderName(web3Provider), new Web3(web3Provider))
    } else {
      throw new Error("Invalid connection type")
    }
  }

  disconnect = async (web3Provider = null) => {
    this.unsubscribeEvents()
    if (window && window.localStorage) {
      window.localStorage.removeItem('WEB3_LOGGED')
    }
    let curr = this.state.accounts && this.state.accounts.length > 0 ? this.state.accounts[0] : null
    if (!web3Provider) {
      web3Provider = await this.getInjectedWeb3Provider()
    }
    const _web3 = this.getWeb3(web3Provider)
    const chaind = await this.getChainId(web3Provider)
    setWeb3(_web3, null)
    await this.killWalletConnectorSession()
    this.setState({ 
      accounts: [],
      activeIndex: null,
      walletConnector: null,
      hasWeb3Provider: !!web3Provider,
      networkId: chaind,
      web3: _web3,
      name: this.getProviderName(web3Provider)
    }, () => {
      if (curr !== null) {
        this.props.onChangeAccount(null, curr)
      }
      this.props.onLoaded()
    })
  }

  unsubscribeEvents = () => {
    if (this.state.web3 && this.state.web3.currentProvider && this.state.web3.currentProvider.removeAllListeners) {
      this.state.web3.currentProvider.removeAllListeners()
    }
  }

  killWalletConnectorSession = async (walletConnector = null) => {
    walletConnector = walletConnector ? walletConnector : this.state.walletConnector
    if (walletConnector) {
      try {
        await walletConnector.killSession()
      } catch(e) {
        console.error(e)
      } finally {
        if (window && window.localStorage) {
          window.localStorage.removeItem('walletconnect')
        }
      }
    }
  }

  render() {
    return this.props.children
  }
}

Web3Provider.childContextTypes = childContextTypes
export default Web3Provider