import './BuySell.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet } from '@fortawesome/free-solid-svg-icons'
import { balanceOf } from '../../util/erc20Methods'
import { fromDecimals } from '../../util/constants'
import DecimalInput from '../Util/DecimalInput'

class BuySell extends Component {
  constructor() {
    super()
    this.state = { 
      selectedBuySellTab: 1, 
      selectedLimitMarketTab: 1,
      acoTokenBalance: null,
      strikeAssetBalance: null,
      amountInputValue: "",
      priceInputValue: "",
      expirationInputValue: "24"
    }
  }
  
  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle || 
      this.props.option !== prevProps.option) {
      this.loadBalances()
    }
  }

  componentDidMount = () => {
    this.loadBalances()
  }

  loadBalances = () => {
    var userAddress = this.context && this.context.web3 && this.context.web3.selectedAccount
    balanceOf(this.props.option.acoToken, userAddress).then(result => {
      this.setState({acoTokenBalance: result})
    })
    balanceOf(this.props.option.strikeAsset, userAddress).then(result => {
      this.setState({strikeAssetBalance: result})
    })
  }

  selectBuySellTab = (selectedBuySellTab) => () => {
    this.setState({ selectedBuySellTab: selectedBuySellTab })
  }

  selectLimitMarketTab = (selectedLimitMarketTab) => () => {
    this.setState({ selectedLimitMarketTab: selectedLimitMarketTab })
  }

  onSubmitOrder = () => {

  }

  canSubmit = () => {

  }

  goToMint = () => {
    this.props.history.push('/advanced/mint/'+this.props.selectedPair.id+"/"+this.props.option.acoToken)
  }

  formatBalance = () => {
    var formattedBalance = "-"
    if (this.state.selectedBuySellTab === 1 && this.state.strikeAssetBalance) {
      formattedBalance = fromDecimals(this.state.strikeAssetBalance, this.props.option.strikeAssetInfo.decimals, 4)
      formattedBalance += " USDC";
    }
    else if (this.state.selectedBuySellTab === 2 && this.state.acoTokenBalance) {
      formattedBalance = fromDecimals(this.state.acoTokenBalance, this.props.option.acoTokenInfo.decimals, 4)
      formattedBalance += " ACO";
    }
    return formattedBalance
  }

  onPriceChange = (value) => {
    this.setState({priceInputValue: value})
  }

  onExpirationChange = (value) => {
    this.setState({expirationInputValue: value})
  }

  onAmountChange = (value) => {
    this.setState({amountInputValue: value})
  }
  
  render() {
    return (
      <div>
        <div className="buy-sell-box">
          <div className="buy-sell-box-content">
            <div className="buy-sell-tabs">
              <div className={"buy-tab " +  (this.state.selectedBuySellTab === 1 ? "active" : "")} onClick={this.selectBuySellTab(1)}>Buy</div>
              <div className={"sell-tab " + (this.state.selectedBuySellTab === 2 ? "active" : "")} onClick={this.selectBuySellTab(2)}>Sell</div>
            </div>
            <div className="limit-market-tabs">
              <span className={"limit-market-tab " +  (this.state.selectedLimitMarketTab === 1 ? "active" : "")} onClick={this.selectLimitMarketTab(1)}>Limit</span>
              <span className={"limit-market-tab " +  (this.state.selectedLimitMarketTab === 2 ? "active" : "")} onClick={this.selectLimitMarketTab(2)}>Market</span>
            </div>
            <div className={"place-order-tab " +  (this.state.selectedLimitMarketTab === 1 ? "left-tab" : "right-tab")}>
              <div className="place-order-balance-row">
                <FontAwesomeIcon icon={faWallet}/>
                {this.formatBalance()}
                {this.state.selectedBuySellTab === 2 && <span>(<a onClick={this.goToMint}>Mint</a>)</span>}
              </div>
              <div className="place-order-label-input-row amount-row">
                <div className="place-order-label-item">
                  Amount
                </div>
                <div className="order-input-wrapper">
                  <DecimalInput className="order-input" 
                      notifyOnChange={true} 
                      onChange={this.onAmountChange} 
                      value={this.state.amountInputValue}
                      placeholder="0.00"></DecimalInput>
                </div>
              </div>
              {this.state.selectedLimitMarketTab === 1 && <div className="place-order-label-input-row price-row">
                <div className="place-order-label-item">
                  Price
                </div>
                <div className="order-input-wrapper">
                  <DecimalInput className="order-input" 
                      notifyOnChange={true} 
                      onChange={this.onPriceChange} 
                      value={this.state.priceInputValue}
                      placeholder="0.00"></DecimalInput>
                  <div className="order-input-right-label">
                    USDC
                  </div>
                </div>
              </div>}
              <div className="place-order-separator"></div>
              {this.state.selectedLimitMarketTab === 1 && <>
                <div className="place-order-label-input-row expiration-row">
                  <div className="place-order-label-item">
                    Order Expiration
                  </div>
                  <div className="order-input-wrapper">
                    <DecimalInput className="order-input" 
                      notifyOnChange={true} 
                      onChange={this.onExpirationChange} 
                      value={this.state.expirationInputValue}
                      placeholder="24"></DecimalInput>
                    <div className="order-input-right-label">
                      H
                    </div>
                  </div>
                </div>
                <div className="place-order-separator"></div>
              </>}
              <div className="fee-cost-row">
                <label className="fee-cost-label">Fee</label>
                <div className="fee-cost-value">0.00</div>
              </div>
              <div className="fee-cost-row">
                <label className="fee-cost-label">{this.state.selectedBuySellTab === 1 ? "Cost" : "Total" }</label>
                <div className="fee-cost-value bold">0.00 USDC</div>
              </div>
              <div className={"action-btn " + (!this.canSubmit() ? "disabled" : "")} onClick={this.onSubmitOrder}>
                Place {this.state.selectedLimitMarketTab === 1 ? "Limit" : "Market"} Order
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

BuySell.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object,
  orders: PropTypes.array,
}
export default withRouter(BuySell)