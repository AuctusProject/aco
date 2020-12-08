import './OtcTradeTabStep3.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Loading from '../Util/Loading'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClone } from '@fortawesome/free-regular-svg-icons'
import { formatDate, formatWithPrecision, fromDecimals, getBalanceOfAsset, getByAddress, getTimeToExpiry, ONE_SECOND, toDecimals, usdcAddress } from '../../util/constants'
import { getAcoAsset } from '../../util/acoApi'
import CancelOrderModal from './CancelOrderModal'
import AssetInput from '../Util/AssetInput'
import TakeOrderModal from './TakeOrderModal'

class OtcTradeTabStep3 extends Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  componentDidMount = () => {
    this.loadOrderInfo()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.otcOrder !== prevProps.otcOrder) {
      this.loadOrderInfo()
    }
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.loadAssetsBalances()
    }
  }

  loadAssetsBalances = () => {
    var userAddress = this.context && this.context.web3 && this.context.web3.selectedAccount
    var underlyingAddress = this.getUnderlyingAddress()
    if (userAddress && underlyingAddress) {
      getBalanceOfAsset(underlyingAddress, userAddress).then(underlyingBalance => {
        this.setState({underlyingBalance: underlyingBalance})
      })
      getBalanceOfAsset(usdcAddress, userAddress).then(usdcBalance => {
        this.setState({usdcBalance: usdcBalance})
      })
    }
  }

  getUnderlyingAddress = () => {
    if (this.state.selectedOption && this.state.selectedOption.selectedUnderlying) {
      return this.state.selectedOption.selectedUnderlying
    }
    return null;
  }

  loadOrderInfo = () => {
    if (this.props.otcOrder) {
      var optionInfo = this.props.otcOrder.isAskOrder ? this.props.otcOrder.order.signer : this.props.otcOrder.order.sender
      var usdcInfo = !this.props.otcOrder.isAskOrder ? this.props.otcOrder.order.signer : this.props.otcOrder.order.sender
      this.getOrderUnderlyingInfo(optionInfo.underlying).then(acoAsset => {
        var strikeValue = fromDecimals(optionInfo.strikePrice, 6, 6, 0)
        var optionName =
          "ACO " +
          acoAsset.symbol +
          "-" +
          strikeValue +
          "USDC-" +
          (optionInfo.isCall ? "C" : "P") +
          "-" +
          this.getFormattedDate(optionInfo)

        var optionQty = fromDecimals(optionInfo.amount, acoAsset.decimals, 4, 0)
        var usdcValue = fromDecimals(usdcInfo.amount, 6, 4, 0)
        this.setState({ optionInfo: optionInfo, assetInfo: acoAsset, optionName: optionName, optionQty: optionQty, usdcValue: usdcValue })
      })
    }
  }

  getOrderUnderlyingInfo = (underlyingAddress) => {
    return new Promise((resolve, reject) => {
      getAcoAsset(underlyingAddress).then(acoAsset => {
        if (acoAsset) {
          resolve(acoAsset)
        }
        else {
          getByAddress(underlyingAddress).then(acoAsset => {
            resolve(acoAsset)
          })
        }
      })
    })
  }

  isOwnOrder = () => {
    if (this.context && this.context.web3 && this.context.web3.selectedAccount &&
      this.props.otcOrder && this.props.otcOrder.order && this.props.otcOrder.order.signer && this.props.otcOrder.order.signer.responsible) {
      return this.context.web3.selectedAccount.toLowerCase() === this.props.otcOrder.order.signer.responsible.toLowerCase()
    }
    return false
  }

  onNewTradeClick = () => {
    this.props.startNewTrade()
  }

  copyToClipboard = (e) => {
    this.urlInput.select()
    document.execCommand('copy')
    e.target.focus()
  }

  getFormattedDate = (optionInfo) => {
    var expirationDate = new Date(optionInfo.expiryTime * ONE_SECOND)
    var day = expirationDate.getUTCDate()
    var month = expirationDate.toLocaleString('en', { month: 'short', timeZone: 'UTC' }).toUpperCase()
    var year = expirationDate.getUTCFullYear() % 2000
    return day + month + year + "-0800UTC"
  }

  getPremiumPerOption = () => {
    if (this.state.optionQty && this.state.usdcValue && this.state.optionQty > 0 && this.state.usdcValue > 0) {
      var premiumPerOption = this.state.usdcValue / this.state.optionQty
      return "(" + formatWithPrecision(premiumPerOption, 2) + "/option)"
    }
    return null
  }

  getUSDCToCollaterize = () => {
    return this.state.optionQty * fromDecimals(this.state.optionInfo.strikePrice, 6)
  }

  getTimeToExpiryOrder = () => {
    if (this.isExpired()) {
      return "Trade Expired"
    }
    var timeToExpiry = getTimeToExpiry(this.props.otcOrder.order.expiry)
    return "Order expires in: " + (timeToExpiry.days > 0 ?
      `${timeToExpiry.days}d ${timeToExpiry.hours}h` :
      `${timeToExpiry.hours}h ${timeToExpiry.minutes}m`);
  }

  isExpired = () => {
    if (this.props.otcOrder && this.state.optionInfo) {
      var timeToExpiry = getTimeToExpiry(this.props.otcOrder.order.expiry)
      var optionExpiration = this.state.optionInfo.expiryTime * ONE_SECOND
      return (timeToExpiry.days === 0 && timeToExpiry.hours === 0 && timeToExpiry.minutes === 0) ||
        optionExpiration < new Date().getTime()
    }
    return false
  }

  onCancelClick = () => {
    var orderData = {
      nonce: this.props.otcOrder.order.nonce
    }
    this.setState({ cancelOrderData: orderData })
  }

  onCancelOrderHide = () => {
    this.setState({ cancelOrderData: null })
  }

  onTakeOrderHide = () => {
    this.setState({ takeOrderData: null })
  }

  getSummaryDescription = () => {
    var premium = this.state.usdcValue + " USDC"
    var summary = ""
    if (this.props.otcOrder.isAskOrder) {
      summary = `Pay ${premium} for the right`
    }
    else {
      summary = `Receive ${premium} in return for assuming the obligation`
    }
    summary += ` to ${this.state.optionInfo.isCall ? "sell" : "buy"} ${this.state.optionQty} ${this.state.assetInfo.symbol} for ${this.getStrikePriceOption()} USDC each until ${this.getExpirationOption()}.`
    return summary
  }

  getExpirationOption = () => {
    return formatDate(this.state.optionInfo.expiryTime)
  }

  getStrikePriceOption = () => {
    return fromDecimals(this.state.optionInfo.strikePrice, 6, 6, 0)
  }
  
  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  onTakeTradeClick = () => {
    var orderData = {
      isAskOrder: this.props.otcOrder.isAskOrder,
      underlying: this.state.assetInfo,
      isCall: this.props.optionInfo.isCall,
      optionQty: toDecimals(this.state.optionQty, this.state.assetInfo.decimals),
      usdcValue: toDecimals(this.state.usdcValue, 6),
      strikeValue: this.state.optionInfo.strikePrice,
      signature: this.props.otcOrder.signature
    }
    this.setState({ takeOrderData: orderData })
  }

  render() {
    return <div className={(this.isExpired() ? "trade-expired" : "")}>
      {(!this.props.otcOrder || !this.state.optionInfo) ? <Loading></Loading> :
        <>
          {this.isExpired() ? <>
            <div className="trade-title">
              Trade Expired
          </div>
            <div className="trade-subtitle">
              Trade expired and is no longer available
          </div>
          </> :
            (this.isOwnOrder() ? <>
              <div className="trade-title">
                Ready To Share
          </div>
              <div className="trade-subtitle">
                Share the link below to complete your trade
          </div>
            </>
              :
              <>
                <div className="trade-title">
                  Complete This Trade
          </div>
                <div className="trade-subtitle">
                  Review the terms of this trade and accept below
          </div>
              </>
            )}
          {this.isOwnOrder() ? <>
            <div className="selected-option-row">
              <div className="selected-option-label">Selected Option:</div>
              <div className="selected-option-name">{this.state.optionName}</div>
            </div>
            <div className="inputs-wrapper action-row">
              <div className="input-column">
                <div className="input-label">Action (You'll)</div>
                <div className="input-field">
                  {this.props.otcOrder.isAskOrder ? "Sell" : "Buy"}
                </div>
              </div>
              <div className="input-column">
                <div className="input-label">Quantity</div>
                <div className="input-field">
                  {this.state.optionQty}
                </div>
              </div>
              <div className="label-column">
                <div className="label-text">
                  {this.props.otcOrder.isAskOrder ? "for" : "with"}
                </div>
              </div>
              <div className="input-column">
                <div className="input-label"></div>
                <div className="input-field">
                  {this.state.usdcValue}
                </div>
              </div>
              <div className="label-column">
                <div className="label-text">
                  USDC
              </div>
              </div>
            </div>
            <div className="otc-value-row">
              {!this.props.otcOrder.isAskOrder ? <div>
                Total premium to be paid: {this.state.usdcValue} USDC {this.getPremiumPerOption()}
              </div> :
                <>
                  {this.state.optionInfo.isCall ?
                    <div>{this.state.assetInfo.symbol} to collaterize: {this.state.optionQty}</div> :
                    <div>USDC to collaterize: {this.getUSDCToCollaterize()}</div>
                  }
                  <div>Total premium to be received: {this.state.usdcValue ? <>{this.state.usdcValue} USDC {this.getPremiumPerOption()}</> : "-"}</div>
                </>}
            </div>
            <div className="counterparty-row">
              Counterparty Address: {this.props.otcOrder.order.sender.responsible}
            </div>
            {!this.isExpired() && <div className="url-input input-group">
              <input ref={input => this.urlInput = input} value={window.location.href} readOnly onClick={this.copyToClipboard} type="text" className="form-control" />
              <div className="input-group-append">
                <div onClick={this.copyToClipboard} className="action-btn solid-blue"><FontAwesomeIcon icon={faClone}></FontAwesomeIcon></div>
              </div>
            </div>}
            {!this.isExpired() && <div className="action-button-wrapper cancel-new-actions">
              <div className="btn-link clickable" onClick={this.onCancelClick}>
                <div>CANCEL THIS TRADE</div>
              </div>
              <div className="btn-link clickable" onClick={this.onNewTradeClick}>
                <div>START A NEW TRADE</div>
              </div>
            </div>}
            <div className="expiry-countdown-row">
              {this.getTimeToExpiryOrder()}
            </div>
            {this.isExpired() &&
              <div className="action-button-wrapper">
                <div className="action-btn medium solid-blue" onClick={this.onNewTradeClick}>
                  <div>CREATE NEW TRADE</div>
                </div>
              </div>}
            <div className="otc-steps-indicator">
              <div></div>
              <div></div>
              <div className="active-step"></div>
            </div>
          </> :
            <>
              <div className="trade-summary-row">
                <div className="summary-label">SUMMARY</div>
                <div className="summary-description">{this.getSummaryDescription()}</div>
              </div>
              <div className="inputs-wrapper summary-row">
                <div className="input-column">
                  <div className="input-label">Your Side</div>
                  <div className="input-field">
                    {!this.props.otcOrder.isAskOrder ? "Sell" : "Buy"}
                  </div>
                </div>
                <div className="input-column">
                  <div className="input-label">Quantity</div>
                  <div className="input-field nowrap">
                    {this.state.optionQty}
                  </div>
                </div>
                <div className="input-column">
                  <div className="input-label">Underlying</div>
                  <div className="input-field">
                    <AssetInput disabled={true} selectedAsset={this.state.assetInfo}></AssetInput>
                  </div>
                </div>
                <div className="input-column">
                  <div className="input-label">Type</div>
                  <div className="input-field">
                    {this.state.optionInfo.isCall ? "CALL" : "PUT"}
                  </div>
                </div>
                <div className="input-column">
                  <div className="input-label">Expiration</div>
                  <div className="input-field nowrap">
                    {this.getExpirationOption()}
                  </div>
                </div>
                <div className="input-column">
                  <div className="input-label">Strike</div>
                  <div className="input-field nowrap">
                    {this.getStrikePriceOption()}
                  </div>
                </div>
              </div>
              <div className="otc-value-row">
                {this.props.otcOrder.isAskOrder ? <div>
                  Total premium to be paid: {this.state.usdcValue} USDC {this.getPremiumPerOption()}
                </div> :
                  <>
                    {this.state.optionInfo.isCall ?
                      <div>{this.state.assetInfo.symbol} to collaterize: {this.state.optionQty}</div> :
                      <div>USDC to collaterize: {this.getUSDCToCollaterize()}</div>
                    }
                    <div>Total premium to be received: {this.state.usdcValue ? <>{this.state.usdcValue} USDC {this.getPremiumPerOption()}</> : "-"}</div>
                  </>}
              </div>
              <div className="counterparty-row">
                Counterparty Address: {this.props.otcOrder.order.sender.responsible}
              </div>
              <div className="expiry-countdown-row">
                {this.getTimeToExpiryOrder()}
              </div>
              {this.isExpired() ?
                <div className="action-button-wrapper">
                  <div className="action-btn medium solid-blue" onClick={this.onNewTradeClick}>
                    <div>CREATE NEW TRADE</div>
                  </div>
                </div> : 
                (this.props.isConnected ? 
                  <div className="action-btn medium solid-blue" onClick={this.onTakeTradeClick}>
                    <div>TAKE TRADE</div>
                  </div> :
                  <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
                    <div>CONNECT WALLET</div>
                  </div>)}
              <div className="otc-steps-indicator">
                <div></div>
                <div></div>
                <div className="active-step"></div>
              </div>
            </>}
        </>}
      {this.state.cancelOrderData && <CancelOrderModal cancelOrderData={this.state.cancelOrderData} onHide={this.onCancelOrderHide} />}
      {this.state.takeOrderData && <TakeOrderModal orderData={this.state.takeOrderData} onHide={this.onTakeOrderHide} />}
    </div>
  }
}

OtcTradeTabStep3.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(OtcTradeTabStep3)