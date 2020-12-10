import './OtcTradeTabStep3.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Web3Utils from 'web3-utils'
import Loading from '../Util/Loading'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClone } from '@fortawesome/free-regular-svg-icons'
import { formatDate, formatWithPrecision, fromDecimals, getBalanceOfAsset, getByAddress, getTimeToExpiry, isEther, ONE_SECOND, OTC_ORDER_STATUS_AVAILABLE, toDecimals, usdcAddress, wethAddress } from '../../util/constants'
import { getAcoAsset } from '../../util/acoApi'
import CancelOrderModal from './CancelOrderModal'
import AssetInput from '../Util/AssetInput'
import TakeOrderModal from './TakeOrderModal'
import { signerNonceStatus } from '../../util/acoOtcMethods'
import ReactTooltip from 'react-tooltip'

class OtcTradeTabStep3 extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isOrderAvailable: null
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
    this.setState({wethBalance: null, assetToPayBalance: null, signerAssetToPayBalance: null})
    var userAddress = this.context && this.context.web3 && this.context.web3.selectedAccount
    if (userAddress && this.state.optionInfo) {
      var assetToPay = this.getAssetToPay()
      var signerAssetToPay = this.getSignerAssetToPay()
      if (isEther(assetToPay)) {
        getBalanceOfAsset(wethAddress, userAddress).then(wethBalance => {
          this.setState({ wethBalance: wethBalance })
        })
      }
      getBalanceOfAsset(assetToPay, userAddress).then(assetToPayBalance => {
        this.setState({ assetToPayBalance: assetToPayBalance })
      })
      getBalanceOfAsset(isEther(signerAssetToPay) ? wethAddress : signerAssetToPay, this.props.otcOrder.order.signer.responsible).then(wethBalance => {
        this.setState({ signerAssetToPayBalance: wethBalance })
      })
    }
  }

  getAmountToPay = () => {
    if (this.props.otcOrder.isAskOrder) 
      return toDecimals(this.state.usdcValue, 6)
    else if (this.state.optionInfo.isCall)
      return this.state.optionInfo.amount
    else
      return this.getUSDCToCollaterize()
  }

  getAssetToPay = () => {
    if (!this.props.otcOrder.isAskOrder && this.state.optionInfo.isCall)
      return this.state.assetInfo.address
    else
      return usdcAddress
  }

  getSignerAmountToPay = () => {
    if (!this.props.otcOrder.isAskOrder) 
      return this.state.usdcValue
    else if (this.state.optionInfo.isCall)
      return this.state.optionInfo.amount
    else
      return this.getUSDCToCollaterize()
  }

  getSignerAssetToPay = () => {
    if (this.props.otcOrder.isAskOrder && this.state.optionInfo.isCall)
      return this.state.assetInfo.address
    else
      return usdcAddress
  }

  getUnderlyingAddress = () => {
    if (this.state.optionInfo && this.state.optionInfo.underlying) {
      return this.state.optionInfo.underlying
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
        this.setState({ optionInfo: optionInfo, assetInfo: acoAsset, optionName: optionName, optionQty: optionQty, usdcValue: usdcValue },
          () => this.loadAssetsBalances())
      })
      this.refreshOrderAvailableStatus()
    }
  }

  refreshOrderAvailableStatus = () => {
    this.setState({ isOrderAvailable: null })
    signerNonceStatus(this.props.otcOrder.order.signer.responsible, this.props.otcOrder.order.nonce).then(nonceStatus => {
      this.setState({ isOrderAvailable: nonceStatus === OTC_ORDER_STATUS_AVAILABLE })
    })
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
    var tempInput = document.createElement("textarea");
    tempInput.style = "position: absolute; left: -1000px; top: -1000px; opacity: 0";
    tempInput.value = this.getCopyValue();
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
  }

  getCopyValue = () => {
    var text = "Auctus OTC - Take This Trade!"
    text += "\n"
    text += this.getSummaryDescription()
    text += "\n"
    text += window.location.href
    return text
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
    return fromDecimals(new Web3Utils.BN(this.state.optionInfo.amount).mul(new Web3Utils.BN(this.state.optionInfo.strikePrice)), this.state.assetInfo.decimals, 0, 0)
  }

  getUSDCToCollaterizeFormatted = () => {
    return fromDecimals(this.getUSDCToCollaterize(), 6)
  }

  getTimeToExpiryOrder = () => {
    if (!this.state.isOrderAvailable) {
      return ""
    }
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

  canTakeOrder = () => {
    return !this.isExpired() && this.state.isOrderAvailable
  }

  onCancelClick = () => {
    var orderData = {
      nonce: this.props.otcOrder.order.nonce
    }
    this.setState({ cancelOrderData: orderData })
  }

  onCancelOrderHide = (completed) => {
    if (completed) {
      this.refreshOrderAvailableStatus()
    }
    this.setState({ cancelOrderData: null })
  }

  onTakeOrderHide = (completed) => {
    this.setState({ takeOrderData: null })
    if (completed) {
      this.props.history.push('/otc/manage/')
    }
  }

  getSummaryDescription = () => {
    var premium = this.state.usdcValue + " USDC"
    var summary = ""
    if (this.props.otcOrder.isAskOrder) {
      summary = `Pay ${premium} for the right to ${this.state.optionInfo.isCall ? "buy" : "sell"} `
    }
    else {
      summary = `Receive ${premium} in return for assuming the obligation to ${this.state.optionInfo.isCall ? "sell" : "buy"} `
    }
    summary += `${this.state.optionQty} ${this.state.assetInfo.symbol} for ${this.getStrikePriceOption()} USDC each until ${this.getExpirationOption()}.`
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
    if (this.canTakeOrder() && !this.getButtonMessage()) {
      var orderData = {
        isAskOrder: this.props.otcOrder.isAskOrder,
        underlying: this.state.assetInfo,
        isCall: this.state.optionInfo.isCall,
        optionQty: this.state.optionInfo.amount,
        usdcValue: toDecimals(this.state.usdcValue, 6),
        strikeValue: this.state.optionInfo.strikePrice,
        order: this.props.otcOrder.order
      }
      this.setState({ takeOrderData: orderData })
    }
  }

  onAssetSelected = (selectedAsset) => {
    this.props.startNewTrade()
  }

  hasBalanceToTake = () => {
    if (!this.props.isConnected) {
      return true
    }
    var amountToPay = this.getAmountToPay()
    var assetToPay = this.getAssetToPay()
    return ((isEther(assetToPay) && new Web3Utils.BN(this.state.wethBalance).gte(new Web3Utils.BN(amountToPay))) ||
      new Web3Utils.BN(this.state.assetToPayBalance).gte(new Web3Utils.BN(amountToPay)))
  }

  signerHasBalanceToMake = () => {
    var amountToPay = this.getSignerAmountToPay()
    return new Web3Utils.BN(this.state.signerAssetToPayBalance).gte(new Web3Utils.BN(amountToPay))
  }

  isCounterpartyWallet = () => {
    return this.isPublicCounterparty() || 
      this.props.otcOrder.order.sender.responsible.toLowerCase() === this.context.web3.selectedAccount.toLowerCase()
  }

  isPublicCounterparty = () => {
    return isEther(this.props.otcOrder.order.sender.responsible)
  }

  getButtonMessage = () => {
    if (!this.hasBalanceToTake()) {
      return "Insufficient funds"
    }
    if (!this.signerHasBalanceToMake()) {
      return "Signer has insufficient funds"
    }
    if (!this.isCounterpartyWallet()) {
      return "Invalid wallet"
    }
    return null
  }

  getErrorMessage = () => {
    if (!this.hasBalanceToTake()) {
      return "You wallet does not have sufficient funds."
    }
    if (!this.signerHasBalanceToMake()) {
      return "Your counterparty wallet does not have sufficient funds."
    }
    if (!this.isCounterpartyWallet()) {
      return `Only address ${this.props.otcOrder.order.sender.responsible} can take this trade.`
    }
    return null
  }

  render() {
    return <div className={"otc-trade-step3 " + (!this.canTakeOrder() ? "order-unavailable" : "")}>
      {(!this.props.otcOrder || !this.state.optionInfo || this.state.isOrderAvailable === null ||
        (this.props.isConnected && (!this.state.assetToPayBalance || !this.state.signerAssetToPayBalance))) ? <Loading></Loading> :
        <>
          {!this.state.isOrderAvailable ? <>
            <div className="trade-title">
              Trade Not Available
            </div>
            <div className="trade-subtitle">
              Order was cancelled or already taken
            </div>
          </> :
          this.isExpired() ? <>
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
                    <div>USDC to collaterize: {this.getUSDCToCollaterizeFormatted()}</div>
                  }
                  <div>Total premium to be received: {this.state.usdcValue ? <>{this.state.usdcValue} USDC {this.getPremiumPerOption()}</> : "-"}</div>
                </>}
            </div>
            <div className="counterparty-row">
              Counterparty Address: {this.isPublicCounterparty() ? "Public Order" : this.props.otcOrder.order.sender.responsible}
            </div>
            {this.canTakeOrder() && <div className="url-input-action-buttons">
              <div className="url-input input-group">
                <input value={window.location.href} readOnly onClick={this.copyToClipboard} type="text" className="form-control" />
                <div className="input-group-append">
                  <div onClick={this.copyToClipboard} className="action-btn solid-blue"><FontAwesomeIcon icon={faClone}></FontAwesomeIcon></div>
                </div>
              </div>
              <div className="action-button-wrapper cancel-new-actions">
                <div className="btn-link clickable cancel-link" onClick={this.onCancelClick}>
                  <div>CANCEL THIS TRADE</div>
                </div>
                <div className="btn-link clickable" onClick={this.onNewTradeClick}>
                  <div>START A NEW TRADE</div>
                </div>
              </div>
            </div>}
            <div className="expiry-countdown-row">
              {this.getTimeToExpiryOrder()}
            </div>
            {!this.canTakeOrder() &&
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
                    <AssetInput onAssetSelected={this.onAssetSelected} disabled={true} showTokenImportedModal={this.canTakeOrder()} selectedAsset={this.state.assetInfo}></AssetInput>
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
              <div className={"otc-value-row " + (!this.hasBalanceToTake() ? "insufficient-funds" : "")}>
                {this.props.otcOrder.isAskOrder ? <div>
                  Total premium to be paid: {this.state.usdcValue} USDC {this.getPremiumPerOption()}
                </div> :
                  <>
                    {this.state.optionInfo.isCall ?
                      <div>{this.state.assetInfo.symbol} to collaterize: {this.state.optionQty}</div> :
                      <div>USDC to collaterize: {this.getUSDCToCollaterizeFormatted()}</div>
                    }
                    <div>Total premium to be received: {this.state.usdcValue ? <>{this.state.usdcValue} USDC {this.getPremiumPerOption()}</> : "-"}</div>
                  </>}
              </div>
              <div className={"counterparty-row "+ (!this.isCounterpartyWallet() ? "invalid-counterparty" : "")}>
                Counterparty Address: {this.isPublicCounterparty() ? "Public Order" : this.props.otcOrder.order.sender.responsible}
              </div>
              <div className="expiry-countdown-row">
                {this.getTimeToExpiryOrder()}
              </div>
              <div className="action-button-wrapper">{!this.canTakeOrder() ?
                  <div className="action-btn medium solid-blue" onClick={this.onNewTradeClick}>
                    <div>CREATE NEW TRADE</div>
                  </div>:
                (this.props.isConnected ?
                  <div className={"action-btn medium solid-blue "+(this.getButtonMessage()?"disabled":"")}  data-tip data-for="button-tooltip" onClick={this.onTakeTradeClick}>
                    <div>{this.getButtonMessage() ? this.getButtonMessage() : "TAKE TRADE"}</div>
                    {this.getErrorMessage() && <ReactTooltip className="button-tooltip" id="button-tooltip">
                      {this.getErrorMessage()}
                    </ReactTooltip>}
                  </div> :
                  <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
                    <div>CONNECT WALLET</div>
                  </div>)}
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