import './SimpleBuyTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import DecimalInput from '../Util/DecimalInput'
import OptionBadge from '../OptionBadge'
import SimpleDropdown from '../SimpleDropdown'
import { formatDate, groupBy, fromDecimals, formatWithPrecision, toDecimals, isEther, erc20Proxy, maxAllowance } from '../../util/constants'
import { getOptionFormattedPrice } from '../../util/acoTokenMethods'
import OptionChart from '../OptionChart'
import { getSwapQuote } from '../../util/zrxApi'
import Web3Utils from 'web3-utils'
import { checkTransactionIsMined, getNextNonce } from '../../util/web3Methods'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { allowDeposit, allowance } from '../../util/erc20Methods'

class SimpleBuyTab extends Component {
  constructor(props) {
    super(props)
    this.state = { selectedType: 1, selectedOption: null }
  }

  componentDidMount = () => {
    if (this.props.selectedPair) {
      this.selectType(this.state.selectedType)
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair) {
      this.selectType(this.state.selectedType)
    }
  }

  onQtyChange = (value) => {
    this.setState({ qtyValue: value}, () => this.refreshSwapQuote(this.state.selectedOption))
  }

  selectType = (type) => {
    var strikeOptions = this.filterStrikeOptions(type)
    this.setState({ selectedType: type, strikeOptions: strikeOptions}, this.setSelectedOption)
  }

  onStrikeChange = (strikeOption) => {
    var expirationOptions = this.filterExpirationOptions(strikeOption, this.state.selectedType)
    this.setState({selectedStrike: strikeOption, expirationOptions: expirationOptions}, this.setSelectedOption)    
  }

  filterExpirationOptions = (strikeOption, type) => {
    var filteredOptions = this.props.options.filter(o => o.strikePrice === strikeOption.value && o.isCall === (type === 1))
    var grouppedOptions = groupBy(filteredOptions, "expiryTime")
    var hasCurrentSelectedExpiration = false
    var expirationOptions = Object.keys(grouppedOptions).map((expiryTime) => {
      if (this.state.selectedExpiration && this.state.selectedExpiration.value === expiryTime) {
        hasCurrentSelectedExpiration = true
      }
      return { value: expiryTime, name: formatDate(expiryTime, true)}
    })
    if (!hasCurrentSelectedExpiration) {
      this.setState({selectedExpiration: null})
    }
    return expirationOptions
  }

  filterStrikeOptions = (type) => {
    var filteredOptions = this.props.options ? this.props.options.filter(o => o.isCall === (type === 1)) : []
    var grouppedOptions = groupBy(filteredOptions, "strikePrice")
    var hasCurrentSelectedStrike = false
    var strikeOptions = Object.keys(grouppedOptions).map((strikePrice) => {
      if (this.state.selectedStrike && this.state.selectedStrike.value === strikePrice) {
        hasCurrentSelectedStrike = true
      }
      return { value: strikePrice, name: getOptionFormattedPrice(grouppedOptions[strikePrice][0])}
    })
    if (!hasCurrentSelectedStrike) {
      this.setState({selectedStrike: null, selectedExpiration: null}, this.setSelectedOption)
    }
    return strikeOptions
  }

  onExpirationChange = (expirationOption) => {
    this.setState({selectedExpiration: expirationOption}, this.setSelectedOption)
  }

  setSelectedOption = () => {
    var selectedOption = this.getSelectedOption()
    this.refreshSwapQuote(selectedOption)
    this.setState({selectedOption: selectedOption})
  }

  getSelectedOption = () => {
    if (this.state.selectedType && this.state.selectedStrike && this.state.selectedExpiration) {
      var filteredOptions = this.props.options.filter(o => 
        o.isCall === (this.state.selectedType === 1) && 
        o.strikePrice === this.state.selectedStrike.value &&
        o.expiryTime.toString() === this.state.selectedExpiration.value)
      if (filteredOptions && filteredOptions.length === 1) {
        return filteredOptions[0]
      }
    }
    return null    
  }

  onBuyClick = () => {
    if (this.canBuy()) {
      getNextNonce(this.context.web3.selectedAccount).then(nonce => {
        var stepNumber = 0
        this.needApprove().then(needApproval => {
          if (needApproval) {
            this.setStepsModalInfo(++stepNumber, needApproval)
            allowDeposit(this.context.web3.selectedAccount, maxAllowance, this.state.selectedOption.strikeAssetInfo.address, erc20Proxy, nonce)
              .then(result => {
                if (result) {
                  this.setStepsModalInfo(++stepNumber, needApproval)
                  checkTransactionIsMined(result).then(result => {
                    if (result) {
                      this.sendBuyTransaction(stepNumber, ++nonce, needApproval)
                    }
                    else {
                      this.setStepsModalInfo(-1, needApproval)
                    }
                  })
                    .catch(() => {
                      this.setStepsModalInfo(-1, needApproval)
                    })
                }
                else {
                  this.setStepsModalInfo(-1, needApproval)
                }
              })
              .catch(() => {
                this.setStepsModalInfo(-1, needApproval)
              })
          }
          else {
            stepNumber = 2
            this.sendBuyTransaction(stepNumber, nonce, needApproval)
          }
        })
      })
    }
  }

  sendBuyTransaction = (stepNumber, nonce, needApproval) => {
    this.setStepsModalInfo(++stepNumber, needApproval)
    this.sendTransactionWithNonce(null, null, this.context.web3.selectedAccount, this.state.swapInfo.to, this.state.swapInfo.value, this.state.swapInfo.data, null, nonce)
      .then(result => {
        if (result) {
          this.setStepsModalInfo(++stepNumber, needApproval)
          checkTransactionIsMined(result)
            .then(result => {
              if (result) {
                this.setStepsModalInfo(++stepNumber, needApproval)
              }
              else {
                this.setStepsModalInfo(-1, needApproval)
              }
            })
            .catch(() => {
              this.setStepsModalInfo(-1, needApproval)
            })
        }
        else {
          this.setStepsModalInfo(-1, needApproval)
        }
      })
      .catch(() => {
        this.setStepsModalInfo(-1, needApproval)
      })
  }

  setStepsModalInfo = (stepNumber, needApproval) => {
    var title = (needApproval && stepNumber <= 2) ? "Unlock token" : "Buy"
    var subtitle = ""
    var img = null
    var option = this.state.selectedOption
    var unlockSymbol =  (option.strikeAssetInfo.symbol)
    if (needApproval && stepNumber === 1) {
      subtitle = "Confirm on Metamask to unlock " + unlockSymbol + "."
      img = <MetamaskLargeIcon />
    }
    else if (needApproval && stepNumber === 2) {
      subtitle = "Unlocking " + unlockSymbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = "Confirm on Metamask to buy " + this.state.qtyAmount + " " + option.acoTokenInfo.symbol  + "."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 4) {
      subtitle = "Buying " + this.state.qtyAmount + " " + option.acoTokenInfo.symbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 5) {
      subtitle = "You have successfully purchased the options."
      img = <DoneLargeIcon />
    }
    else if (stepNumber === -1) {
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon />
    }

    var steps = []
    if (needApproval) {
      steps.push({ title: "Unlock", progress: stepNumber > 2 ? 100 : 0, active: true })
    }
    steps.push({ title: "Buy", progress: stepNumber > 4 ? 100 : 0, active: stepNumber >= 3 ? true : false })
    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        steps: steps,
        img: img,
        isDone: (stepNumber === 5 || stepNumber === -1),
        onDoneButtonClick: (stepNumber === 5 ? this.onDoneButtonClick : this.onHideStepsModal)
      }
    })
  }

  needApprove = () => {
    return new Promise((resolve) => {
      if (!this.isPayEth()) {
        allowance(this.context.web3.selectedAccount, this.state.selectedOption.strikeAssetInfo.address, erc20Proxy).then(result => {
          var resultValue = new Web3Utils.BN(result)
          resolve(resultValue.lt(toDecimals(this.state.payValue, this.getPayDecimals())))
        })
      }
      else {
        resolve(false)
      }
    })
  }
  
  isPayEth = () => {
    return isEther(this.state.selectedOption.strikeAssetInfo.address)
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  getButtonMessage = () => {
    if (!this.state.qtyValue || this.state.qtyValue < 0) {
      return "Enter an amount"
    }
    if (!this.state.selectedStrike) {
      return "Select strike"
    }
    if (!this.state.selectedExpiration) {
      return "Select expiration"
    }
    if (this.state.errorMessage) {
      return this.state.errorMessage
    }
    return null
  }

  canBuy = () => {
    return (!this.state.loadingSwap && this.getButtonMessage() === null) 
  }
  
  getAcoOptionPrice = () => {    
    if (this.state.swapQuote) {
      return parseFloat(this.state.swapQuote.price)
    }
    return null
  }

  refreshSwapQuote = (selectedOption) => {
    this.setState({swapQuote: null, errorMessage: null, loadingSwap: true}, () => {
      if (selectedOption && this.state.qtyValue && this.state.qtyValue > 0) {
        getSwapQuote(selectedOption.acoToken, selectedOption.strikeAsset, toDecimals(this.state.qtyValue, selectedOption.acoTokenInfo.decimals).toString(), true).then(swapInfo => {
          this.setState({swapQuote: swapInfo, errorMessage: null, loadingSwap: false})
        }).catch((err) => {
          if (this.isInsufficientLiquidity(err)) {
            this.setState({swapQuote: null, errorMessage: "Insufficient liquidity", loadingSwap: false})
          }
          else {
            this.setState({swapQuote: null, errorMessage: "Exchange unavailable", loadingSwap: false})
          }
        })
      }
      else {
        this.setState({swapQuote: null, errorMessage: null, loadingSwap: false})
      }
    })
  }

  isInsufficientLiquidity = (err) => {
    return err && err.response && err.response.data && err.response.data.validationErrors && 
      err.response.data.validationErrors.filter(v => v.reason === "INSUFFICIENT_ASSET_LIQUIDITY").length > 0
  }

  getTotalToBePaid = () => {
    if (this.state.qtyValue &&  this.state.qtyValue > 0) {
      var optionPrice = this.getAcoOptionPrice()
      if (optionPrice) {
        return this.state.qtyValue * optionPrice
      }
    }
    return null
  }

  getTotalToBePaidFormatted = () => {
    var totalToBePaid = this.getTotalToBePaid()
    if (totalToBePaid) {
      return totalToBePaid + " " + this.props.selectedPair.strikeAssetSymbol
    }
    return "-"
  }

  render() {
    var selectedOption = this.state.selectedOption
    var priceFromDecimals = selectedOption ? parseFloat(fromDecimals(selectedOption.strikePrice, selectedOption.strikeAssetInfo.decimals)) : null
    var optionPrice = this.getAcoOptionPrice()
    return <div className="simple-buy-tab">
      <div className="inputs-wrapper">
        <div className="input-column">
          <div className="input-label">Qty</div>
          <div className="input-field">
            <DecimalInput tabIndex="-1" placeholder="Option amount" onChange={this.onQtyChange} value={this.state.qtyValue}></DecimalInput>
          </div>
        </div>
        <div className="input-column">
          <div className="input-label">Type</div>
          <div className="input-field type-toggle">
            <OptionBadge onClick={() => this.selectType(1)} className={this.state.selectedType === 1 ? "active" : "unselected"} isCall={true}/>
            <OptionBadge onClick={() => this.selectType(2)} className={this.state.selectedType === 2 ? "active" : "unselected"} isCall={false}/>
          </div>
        </div>
        <div className="input-column strike-column">
          <div className="input-label">Strike</div>
          <div className="input-field">
            <SimpleDropdown placeholder="Select strike" selectedOption={this.state.selectedStrike} options={this.state.strikeOptions} onSelectOption={this.onStrikeChange}></SimpleDropdown>
          </div>
        </div>
        <div className="input-column expiration-column">
          <div className="input-label">Expiration</div>
          <div className="input-field">
            {this.state.selectedStrike ? 
            <SimpleDropdown placeholder="Select expiration" selectedOption={this.state.selectedExpiration} options={this.state.expirationOptions} onSelectOption={this.onExpirationChange}></SimpleDropdown>:
              <span className="simple-dropdown-placeholder">Select strike first</span>
            }
          </div>
        </div>
      </div>
      <div className="chart-and-prices">
        <div className="option-chart-wrapper">
          <OptionChart isCall={this.state.selectedType === 1} isBuy={true} strikePrice={priceFromDecimals} optionPrice={optionPrice} quantity={this.state.qtyValue}/>
        </div>
        <div className="prices-wrapper">
          <div className="input-column">
            <div className="input-label">Total to be paid</div>
            <div className="input-value">
              {this.getTotalToBePaidFormatted()}
            </div>
          </div>
          <div className="separator"></div>
          <div className="input-column">
            <div className="input-label">Prices per option:</div>
            <div className="price-value">ACO: {optionPrice && formatWithPrecision(optionPrice)}</div>
            <div className="price-value">ACO: $20</div>
            <div className="price-value">ACO: $20</div>
          </div>
        </div>
      </div>
      
      <div className="action-button-wrapper">
        {this.canBuy() ?
          (this.props.isConnected ? 
            <div className="home-btn medium solid-green" onClick={this.onBuyClick}>
              <div>BUY</div>
            </div> :
            <div className="home-btn medium solid-green" onClick={this.onConnectClick}>
              <div>CONNECT ACCOUNT</div>
            </div>) :
          <div className="home-btn medium solid-green disabled">
            <div>{this.state.loadingSwap ? "Loading..." : this.getButtonMessage()}</div>
          </div>}
      </div>
    </div>
  }
}

SimpleBuyTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(SimpleBuyTab)