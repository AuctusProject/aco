import './BuySell.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet } from '@fortawesome/free-solid-svg-icons'
import { balanceOf } from '../../util/contractHelpers/erc20Methods'
import { fromDecimals, getBalanceOfAsset, toDecimals } from '../../util/constants'
import DecimalInput from '../Util/DecimalInput'
import { getAdvancedOrderSteps, getQuote, buildQuotedData, getMintSteps } from '../../util/acoSwapUtil'
import BigNumber from 'bignumber.js'
import { error } from '../../util/sweetalert'
import CreateAdvancedOrderModal from './CreateAdvancedOrderModal'
import { getCollateralAmountInDecimals, getCollateralInfo } from '../../util/contractHelpers/acoTokenMethods'

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
      expirationInputValue: "24",
      steps: null
    }
  }
  
  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.componentDidMount()
    } else if (this.props.accountToggle !== prevProps.accountToggle || 
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
    if (this.props.option.isCall) {
      getBalanceOfAsset(this.props.option.underlying, userAddress).then(result => {
        this.setState({underlyingBalance: result})
      })
    }
  }

  selectBuySellTab = (selectedBuySellTab) => () => {
    this.setState({ selectedBuySellTab: selectedBuySellTab })
  }

  selectLimitMarketTab = (selectedLimitMarketTab) => () => {
    this.setState({ selectedLimitMarketTab: selectedLimitMarketTab })
  }

  canSubmit = () => {
    return (this.state.selectedLimitMarketTab === 2 || this.state.priceInputValue > 0) && this.state.amountInputValue > 0
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

  formatCollateralBalance = () => {
    var formattedBalance = "-"
    var collateralBalance = this.getCollateralBalance()    
    if (collateralBalance) {
      var collateralInfo = getCollateralInfo(this.props.option)
      formattedBalance = fromDecimals(collateralBalance, collateralInfo.decimals, 4)
      formattedBalance += " "+ collateralInfo.symbol;
    }
    return formattedBalance
  }

  getCollateralBalance = () => {
    return this.props.option.isCall ? this.state.underlyingBalance : this.state.strikeAssetBalance
  }

  getCollateralSymbol = () => {
    return getCollateralInfo(this.props.option).symbol
  }

  formatCollateralValue = () => {
    var collateralAmount = this.getAmountToCollaterizeInDecimals()
    var collateralInfo = getCollateralInfo(this.props.option)
    return fromDecimals(collateralAmount, collateralInfo.decimals)
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

  setOrderData = (isBuy, price, amount) => {
    this.setState({selectedBuySellTab: isBuy ? 1 : 2, priceInputValue: price, amountInputValue: amount})
  }

  onSubmitOrder = async () => {
    if (this.canSubmit()) {
      this.placeOrder(false)
    }
  }

  placeOrder = async (minted) => {
    var isBuy = this.state.selectedBuySellTab === 1
    var isLimit = this.state.selectedLimitMarketTab === 1
    var amountValue = this.state.amountInputValue
    var priceValue = isLimit ? this.state.priceInputValue : null
    var quote = await getQuote(isBuy, this.props.option, amountValue, false, priceValue, this.props.slippage)
    var amountInDecimals = new BigNumber(toDecimals(this.state.amountInputValue, this.props.option.acoTokenInfo.decimals))
    if (!isLimit && quote.acoAmount.isLessThan(amountInDecimals)) {
        error("There are not enough orders to fill this amount")
        return
    }
    var hasBalances = await this.checkBalances(isBuy, amountValue, priceValue)
    if (hasBalances) {
      if (!minted) {
        var mintAmount = this.getAmountToCollaterizeInDecimals()
        minted = mintAmount.isLessThanOrEqualTo(0)
        if (!minted) {
          var mintSteps = await getMintSteps(this.context.web3.selectedAccount, this.props.option, this.getAmountToCollaterizeInDecimals())
          this.setState({mintSteps: mintSteps})
        }
      }
      if (minted) {
        var steps = await getAdvancedOrderSteps(this.context.web3.selectedAccount, quote, this.props.option, amountValue, priceValue, isBuy, this.state.expirationInputValue, this.getAmountToCollaterizeInDecimals())
        this.setState({steps: steps})
      }
    }
  }

  checkBalances = (isBuy, amountValue, priceValue) => {
    if (isBuy) {
      var totalCost = toDecimals(new BigNumber(amountValue).times(priceValue), this.props.option.strikeAssetInfo.decimals)
      if (new BigNumber(this.state.strikeAssetBalance).isLessThan(totalCost)) {
        error("You don't have enough "+this.props.option.strikeAssetInfo.symbol)
        return false
      }
    }
    else {
      var amountToCollaterizeInDecimals = this.getAmountToCollaterizeInDecimals()
      var collateralBalance = this.getCollateralBalance()
      if (new BigNumber(collateralBalance).isLessThan(amountToCollaterizeInDecimals)) {
        error("You don't have enough " + this.getCollateralSymbol() + " to collaterize")
        return false
      }
    }
    return true
  }

  getAmountToMint = () => {
    if (this.state.selectedBuySellTab === 2) {
      var amountInDecimals = new BigNumber(toDecimals(this.state.amountInputValue, this.props.option.acoTokenInfo.decimals))
      var acoBalance = new BigNumber(this.state.acoTokenBalance)
      if (acoBalance.isLessThan(amountInDecimals)) {
        return amountInDecimals.minus(acoBalance)
      }
    }
    return new BigNumber(0)
  }

  getAmountToCollaterizeInDecimals = () => {
    var amountToMint = this.getAmountToMint()
    return new BigNumber(getCollateralAmountInDecimals(this.props.option, amountToMint.toString()))
  }

  getTotalCost = () => {
    if (this.state.selectedLimitMarketTab === 1) {
      if (this.state.amountInputValue && this.state.priceInputValue) {
        return new BigNumber(this.state.amountInputValue).times(this.state.priceInputValue).toFixed(2) + " USDC"
      }
    }
    else {
      if (this.state.amountInputValue) {
        var orders = this.state.selectedBuySellTab === 1 ? this.getSellOrders() : this.getBuyOrders()
        var amountInDecimals = new BigNumber(toDecimals(this.state.amountInputValue, this.props.option.acoTokenInfo.decimals))
        var quotedData = buildQuotedData(this.props.option, orders, amountInDecimals)
        if (!quotedData.acoAmount.isLessThan(amountInDecimals)) {
          return new BigNumber(fromDecimals(quotedData.strikeAssetAmount, this.props.option.strikeAssetInfo.decimals)).toFixed(2) + " USDC"
        }        
      }
    }
    return "-"
  }

  getBuyOrders = () => {
    return this.context.orderbook && this.context.orderbook.bid && this.context.orderbook.bid.orders
  }

  getSellOrders = () => {
    return this.context.orderbook && this.context.orderbook.ask && this.context.orderbook.ask.orders
  }

  onCreateOrderHide = (isDone) => {
    if (isDone) {
      this.loadBalances()
      this.props.loadBalances()
    }
    this.setState({ steps: null })
  }

  onMintHide = (isDone) => {
    if (isDone) {
      this.loadBalances()
      this.props.loadBalances()
      this.placeOrder(true)
    }
    this.setState({ mintSteps: null })
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
                {this.state.selectedBuySellTab === 2 && <span>(<div onClick={this.goToMint}>Mint</div>)</span>}
              </div>
              {this.state.selectedBuySellTab === 2 && <div className="place-order-balance-row">
                <FontAwesomeIcon icon={faWallet}/>
                {this.formatCollateralBalance()}
              </div>}
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
              {this.state.selectedBuySellTab === 2 && this.getAmountToCollaterizeInDecimals().isGreaterThan(0) &&
                <div className="fee-cost-row">
                  <label className="fee-cost-label">{this.getCollateralSymbol()} to collaterize</label>
                  <div className="fee-cost-value">{this.formatCollateralValue()}</div>
                </div>
              }
              <div className="fee-cost-row">
                <label className="fee-cost-label">{this.state.selectedBuySellTab === 1 ? "Cost" : "Total to receive" }</label>
                <div className="fee-cost-value bold">{this.getTotalCost()}</div>
              </div>
              <div className={"action-btn " + (!this.canSubmit() ? "disabled" : "")} onClick={this.onSubmitOrder}>
                Place {this.state.selectedLimitMarketTab === 1 ? "Limit" : "Market"} Order
              </div>
            </div>
          </div>
        </div>
        {this.state.mintSteps && <CreateAdvancedOrderModal steps={this.state.mintSteps} onHide={this.onMintHide} ></CreateAdvancedOrderModal>}
        {this.state.steps && <CreateAdvancedOrderModal steps={this.state.steps} onHide={this.onCreateOrderHide} ></CreateAdvancedOrderModal>}
      </div>
    );
  }
}

BuySell.contextTypes = {
  web3: PropTypes.object,
  ticker: PropTypes.object,
  orderbook: PropTypes.object,
}
export default BuySell