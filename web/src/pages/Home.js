import './Home.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { groupBy, formatDate } from '../util/constants'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import TradeIcon from '../partials/Util/TradeIcon'
import { getTokensList } from '../util/acoApi'
import { getPairsFromOptions, getOptionsFromPair } from '../util/acoFactoryMethods'
import PairDropdown from '../partials/PairDropdown'
import TradeOptionsList, { TradeOptionsListLayoutMode } from '../partials/TradeOptionsList'
import { ALL_OPTIONS_KEY } from './Trade'

class Home extends Component {

  constructor(props) {
    super(props)
    this.isMobile = window.innerWidth < 768
    this.state = {
      pairs: null,
      options: null,
      selectedExpiryTime: ALL_OPTIONS_KEY,
      whyAnimation: (this.isMobile ? "" : " unshown "),
      whyShowAnimation: (this.isMobile ? "" : " unshown "),
      case1Animation: (this.isMobile ? "" : " unshown "),
      case2Animation: (this.isMobile ? "" : " unshown "),
      case1class: "case-hovered",
      case2class: "",
      case3class: "",
      case4class: "",
      joinAnimation: (this.isMobile ? "" : " unshown "),
      startTradingAnimation: (this.isMobile ? "" : " unshown ")
    }
  }

  componentWillUnmount() {
    document.removeEventListener("scroll", () => {})
  }

  componentDidMount = () => {
    if (window.location.pathname !== "/") {
      this.props.history.replace('/')
    }
    if (!this.isMobile) {
      document.addEventListener("scroll", () => this.setAnimations(), false)
      setTimeout(() => this.setAnimations(), 10)
    }
    this.loadAvailableOptions()
  }

  setAnimations = () => {
    let whyIsVisible = this.isVisible(this.whyRef)
    this.setAnimation(whyIsVisible, "whyAnimation", "slide-up")
    this.setState({whyShowAnimation: (whyIsVisible ? " show-animation " : " unshown ")})
    this.setAnimation(this.isVisible(this.case1Ref), "case1Animation", "slide-up")
    this.setAnimation(this.isVisible(this.case2Ref), "case2Animation", "slide-up")
    this.setState({joinAnimation: (this.isVisible(this.joinRef) ? " show-animation " : " unshown ")})
    this.setState({startTradingAnimation: (this.isVisible(this.startTradingRef) ? " show-animation " : " unshown ")})
  }

  setAnimation = (isVisible, stateName, animationName, removable = true) => {
    if (removable || (isVisible && this.state[stateName].indexOf("unshown") >= 0)) {
      var newState = this.state
      newState[stateName] = (isVisible ? (" base-animation " + animationName) : " unshown ")
      this.setState(newState)
    }
  }

  isVisible = (element) => {
    if (!element) return false
    else {
      const rect = element.getBoundingClientRect()
      return (rect.top >= 0 && rect.top <= window.innerHeight) || 
        (rect.bottom >= 0 && rect.bottom <= window.innerHeight)
    }
  }

  onCase = (item) => {
    let url = ""
    if (item === 1) {
      url = "https://docs.aco.finance/use-cases/buy-eth-calls"      
    } else if (item === 2) {
      url = "https://docs.aco.finance/use-cases/buying-eth-put-options"
    } else if (item === 3) {
      url = "https://docs.aco.finance/use-cases/writing-ethereum-call-options"
    } else if (item === 4) {
      url = "https://docs.aco.finance/use-cases/writing-eth-put-options"
    }
    if (url) {
      window.open(url, '_blank')
    }
  }

  onJoin = () => {
    window.open("https://discord.gg/9JqeMxs", '_blank')
  }

  hoverCase = (item) => {
    if (item === 1) {
      this.setState({case1class: "case-hovered", case2class: "", case3class: "", case4class: ""})
    } else if (item === 2) {
      this.setState({case1class: "", case2class: "case-hovered", case3class: "", case4class: ""})
    } else if (item === 3) {
      this.setState({case1class: "", case2class: "", case3class: "case-hovered", case4class: ""})
    } else if (item === 4) {
      this.setState({case1class: "", case2class: "", case3class: "", case4class: "case-hovered"})
    }
  }

  leaveCase = (item) => {
    this.setState({case1class: "case-hovered", case2class: "", case3class: "", case4class: ""})
  }

  onGetStart(type) {
    this.props.signIn(this.getUrlFromType(type), this.context)
  }

  onAction(type) {
    this.props.history.push(this.getUrlFromType(type))
  }

  getUrlFromType = (type) => {
    if (type === "trade") {
      return "/buy"
    } else if (type === "earn") {
      return "/write"
    }
  }

  loadAvailableOptions = () => {
    getTokensList().then(result => {
      var pairs = getPairsFromOptions(result)
      this.setState({options: result, pairs: pairs}, this.loadOrderBook)
    })
  }

  onPairSelected = (selectedPair) => {
    this.props.onPairSelected(selectedPair)
    this.setState({selectedExpiryTime: ALL_OPTIONS_KEY})
  }

  loadOrderBook = () => {
    this.props.loadOrderbookFromOptions(this.state.options, (this.context && this.context.web3 && this.context.web3.hasMetamask && this.context.web3.validNetwork && this.context.web3.selectedAccount))
  }

  onSelectOption = (option) => {
    this.redirectToAdvancedAction('/advanced/trade/'+option.acoToken)
  }

  onSelectMintOption = (option) => {
    this.redirectToAdvancedAction('/advanced/mint/'+option.acoToken)
  }

  redirectToAdvancedAction(url) {
    if (!this.context || !this.context.web3 || !this.context.web3.hasMetamask || !this.context.web3.validNetwork || !this.context.web3.selectedAccount) {
      this.props.signIn(url, this.context)
    } else {
      this.props.history.push(url)
    }
  }
  
  getOptionsFromPair = () => {
    return getOptionsFromPair(this.state.options, this.props.selectedPair)
  }

  getExpirations = () => {
    var filteredOptions = this.getOptionsFromPair()
    var grouppedOptions = filteredOptions ? groupBy(filteredOptions, "expiryTime") : {}
    return Object.keys(grouppedOptions)
  }

  selectExpiryTime = (selectedExpiryTime) => {
    this.setState({selectedExpiryTime: selectedExpiryTime})
  }

  render() {
    var filteredOptions = this.getOptionsFromPair()
    return (
    <div className="home">
      <section id="head">
        <nav className="navbar navbar-expand-lg navbar-dark navbar-home">
          <div className="container">
            <div className="home-logo"><img src="/logo.svg" alt="Auctus Crypto Options" /></div>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarResponsive">
              <ul className="navbar-nav mx-auto my-2 my-sm-0">
                <a target="_blank"  rel="noopener noreferrer" href="https://docs.aco.finance/faq">FAQ</a>
                <a target="_blank"  rel="noopener noreferrer" href="https://docs.aco.finance/">DOCS</a>
                <a target="_blank"  rel="noopener noreferrer" href="https://discord.gg/9JqeMxs">DISCORD</a>
              </ul>
              <ul className="navbar-nav nav-btns mt-2 mt-sm-0">
                <div className="home-btn small white" onClick={() => this.onAction("trade")}>
                  <div><TradeIcon />BUY OPTIONS</div>
                </div>
                <div className="home-btn small white" onClick={() => this.onAction("earn")}>
                  <div>EARN INCOME</div>
                  <span>(Write options)</span>
                </div>
              </ul>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="head">
            <h1>TRADE ETHEREUM<br/>CALL &amp; PUT OPTIONS</h1>
            <h2>No sign up required. Start trading non-custodial options immediately.</h2>
            <div>
              <div className="home-btn solid-green mr-0 mr-sm-4" onClick={() => this.onAction("trade")}>
                <div><TradeIcon />BUY OPTIONS</div>
              </div>
              <div className="home-btn green mt-3 mt-sm-0" onClick={() => this.onAction("earn")}>
                <div>EARN INCOME</div>
                <span>(Write options)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="why-aco">
        <div className="container">
          <div className="why-aco">
            <h2 className={"home-title" + this.state.whyShowAnimation}>Why use ACO?</h2>
            <div ref={(ref) => this.whyRef = ref}>
              <div className={"home-feature non-custodial m-3 m-lg-0" + this.state.whyAnimation}>
                <span><img src="/images/non-custodial.png" alt="Non-Custodial" /></span>
                <div>
                  <strong>Non-Custodial</strong>
                  <div>You’re always in control of all of your funds.</div>
                </div>
              </div>
              <span className={"feature-division d-none d-lg-block" + this.state.whyShowAnimation}></span>
              <div className={"home-feature fully-collateralized m-3 m-lg-0" + this.state.whyAnimation}>
                <span><img src="/images/fully-collateralized.png" alt="Fully collateralized" /></span>
                <div>
                  <strong>Fully collateralized</strong>
                  <div>No counterparty risk since all positions are fully collateralized.</div>
                </div>
              </div>
              <span className={"feature-division d-none d-lg-block" + this.state.whyShowAnimation}></span>
              <div className={"home-feature trustless-exercise m-3 m-lg-0" + this.state.whyAnimation}>
                <span><img src="/images/flash-exercise.png" alt="Flash Exercise" /></span>
                <div>
                  <strong>Flash Exercise</strong>
                  <div>Exercise options using Uniswap V2 Flash Swaps.</div>
                </div>
              </div>
              <span className={"feature-division d-none d-lg-block" + this.state.whyShowAnimation}></span>
              <div className={"home-feature erc-20 m-3 m-lg-0" + this.state.whyAnimation}>
                <span><img src="/images/erc-20.png" alt="ERC-20" /></span>
                <div>
                  <strong>ERC-20</strong>
                  <div>Making options transferable, fungible, and ready for further DeFi integrations.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="audit">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 mb-lg-0 mb-4">
              <h1>Security Audit</h1>
              <p>To ensure top-notch security, ACO protocol smart contracts were audited by Open Zeppelin and have undergone rigorous internal testing.</p>
              <p>We also have an ongoing bug bounty program where community members can report any bugs or vulnerabilities.</p>
            </div>
            <div className="offset-lg-0 offset-md-2 col-md-4 text-center my-auto py-3 open-zeppelin-col">
              <img alt="" className="logo-openzeppelin" src="/images/logo_openzeppelin.svg"></img>
              <a href="[TODO]" target="_blank" rel="noopener noreferrer"><span className="arrow-link">Protocol Security<FontAwesomeIcon icon={faArrowRight} /></span></a>
            </div>
            <div className="col-md-4 text-center my-auto py-3 bug-bounty-col">
              <div className="bug-bounty-value"><span>$</span>15,000<span>.00</span></div>
              <a href="https://docs.aco.finance/security#bug-bounty" target="_blank" rel="noopener noreferrer"><span className="arrow-link">Bug Bounty<FontAwesomeIcon icon={faArrowRight} /></span></a>
            </div>
          </div>
        </div>
        <img alt="" className="audit-background" src="/images/audit_bg.png"></img>
      </section>
      <section id="available-options">
        <div className="container">
          <h2 className="home-title">Available Options</h2>
          <ul className="pair-dropdown-wrapper"><PairDropdown {...this.props} pairs={this.state.pairs} selectedPair={this.props.selectedPair} onPairSelected={this.onPairSelected} ></PairDropdown></ul>
          {this.props.selectedPair && <div className="expiration-options">
            <div className={"expiration-option " + (this.state.selectedExpiryTime === ALL_OPTIONS_KEY ? "active" : "")} onClick={() => this.selectExpiryTime(ALL_OPTIONS_KEY)}>ALL</div>
            {this.getExpirations().map(expiration => <div key={expiration} className={"expiration-option " + (this.state.selectedExpiryTime === expiration ? "active" : "")} onClick={() => this.selectExpiryTime(expiration)}>{formatDate(expiration)}</div>)}
          </div>}
          {this.props.selectedPair && <TradeOptionsList 
            {...this.props} 
            mode={TradeOptionsListLayoutMode.Home} 
            selectedPair={this.props.selectedPair} 
            selectedExpiryTime={this.state.selectedExpiryTime} 
            onSelectOption={this.onSelectOption} 
            onSelectMintOption={this.onSelectMintOption} 
            options={filteredOptions}
            orderBooks={this.props.orderBooks}/>}
        </div>
      </section>
      <section id="use-cases">
        <div className="container">
          <div className="use-cases">
            <h2 className="home-title">Use Cases</h2>
            <h3>Options can be a useful tool, especially in the crypto volatile market, allowing for greater leverage and the ability to hedge your positions and potentially generate additional income.</h3>
            <div className="row">
              <div className={"home-case col-12 col-lg-6 " + this.state.case1class} onClick={() => this.onCase(1)} onMouseEnter={() => this.hoverCase(1)} onMouseLeave={() => this.leaveCase(1)}>
                <div className={this.state.case1Animation} ref={(ref) => this.case1Ref = ref}>
                  <strong>BUY ETH CALL OPTIONS</strong>
                  <div><span>Take advantage of leverage</span>Determine your risk going into a trade, and control a larger position size with fewer dollars.</div>
                  <span>Learn more<FontAwesomeIcon icon={faArrowRight} /></span>
                </div>
              </div>
              <div className={"home-case col-12 col-lg-6 " + this.state.case2class} onClick={() => this.onCase(2)} onMouseEnter={() => this.hoverCase(2)} onMouseLeave={() => this.leaveCase(2)}>
                <div className={this.state.case1Animation}>
                  <strong>BUY ETH PUT OPTIONS</strong>
                  <div><span>Hedge ETH risk</span>Protect your ETH position against negative moves in the market without limiting the upside potential.</div>
                  <span>Learn more<FontAwesomeIcon icon={faArrowRight} /></span>
                </div>
              </div>
              <div className={"home-case col-12 col-lg-6 " + this.state.case3class} onClick={() => this.onCase(3)} onMouseEnter={() => this.hoverCase(3)} onMouseLeave={() => this.leaveCase(3)}>
                <div className={this.state.case2Animation} ref={(ref) => this.case2Ref = ref}>
                  <strong>WRITE ETH CALL OPTIONS</strong>
                  <div><span>Earn Income on ETH</span>Receive money today for your willingness to sell your ETH at a higher price.</div>
                  <span>Learn more<FontAwesomeIcon icon={faArrowRight} /></span>
                </div>
              </div>
              <div className={"home-case col-12 col-lg-6 " + this.state.case4class} onClick={() => this.onCase(4)} onMouseEnter={() => this.hoverCase(4)} onMouseLeave={() => this.leaveCase(4)}>
                <div className={this.state.case2Animation}>
                  <strong>WRITE ETH PUT OPTIONS</strong>
                  <div><span>Earn Income on USDC</span>Generate some additional income while waiting to buy ETH at a price below the current.</div>
                  <span>Learn more<FontAwesomeIcon icon={faArrowRight} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="join-community">
        <div className="join-community">
          <h2 className="home-title">Join our Community</h2>
          <div>
            <div className="home-discord"><img ref={(ref) => this.joinRef = ref} className={this.state.joinAnimation} src="/images/discord.png" alt="Join our Community" /></div>
            <div className="home-community">
              <div className={"mx-auto mx-sm-0" + this.state.joinAnimation}>Join our community on Discord to learn more about ACO, participate in discussions with the team, and contribute to future of decentralized options.</div>
              <span onClick={() => this.onJoin()} className={"mx-auto mx-sm-0" + this.state.joinAnimation}>Join<FontAwesomeIcon icon={faArrowRight} /></span>
            </div>
          </div>
        </div>
      </section>
      <section id="start-trading">
        <div className="container">
          <div className={"start-trading" + this.state.startTradingAnimation}>
            <h3 ref={(ref) => this.startTradingRef = ref}>Start trading options</h3>
            <h5>Start trading decentralized options on our 0x-based decentralized exchange (DEX)</h5>
            <div>
              <div className="home-btn solid-white mr-0 mr-sm-4" onClick={() => this.onAction("trade")}>
                <div><TradeIcon />BUY OPTIONS</div>
              </div>
              <div className="home-btn black mt-3 mt-sm-0" onClick={() => this.onAction("earn")}>
                <div>EARN INCOME</div>
                <span>(Write options)</span>
              </div>
            </div>
            <span>Powered by<a target="_blank"  rel="noopener noreferrer" href="https://0x.org/"><img src="/images/0x.png" alt="0x" /></a></span>
          </div>
        </div>
      </section>
    </div>)
  }
}

Home.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Home)