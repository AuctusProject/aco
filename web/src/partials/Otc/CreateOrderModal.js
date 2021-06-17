import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { checkTransactionIsMined, getNextNonce, wrapEth } from '../../util/web3Methods'
import Web3Utils from 'web3-utils'
import StepsModal from '../StepsModal/StepsModal'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { fromDecimals, getBalanceOfAsset, isEther, maxAllowance, toDecimals, zero } from '../../util/constants'
import { allowance, allowDeposit } from '../../util/contractHelpers/erc20Methods'
import { signOrder } from '../../util/contractHelpers/acoOtcMethods'
import { createOtcOrder } from '../../util/acoApi'
import { acoOtcAddress, usdcAddress, wethAddress } from '../../util/network'

class CreateOrderModal extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount = () => {
    this.onCreateOrder()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  onCreateOrder = () => {
    getNextNonce(this.context.web3.selectedAccount).then(nonce => {
      var stepNumber = 0
      this.needWrapValue().then(needWrapValue => {
        var needWrap = needWrapValue.gt(zero)
        this.needApprove().then(needApproval => {
          if (needWrap) {
            this.setStepsModalInfo(++stepNumber, needApproval, needWrap)
            wrapEth(this.context.web3.selectedAccount, needWrapValue, nonce)
              .then(result => {
                if (result) {
                  this.setStepsModalInfo(++stepNumber, needApproval, needWrap)
                  checkTransactionIsMined(result).then(result => {
                    if (result) {
                      this.afterWrap(stepNumber, ++nonce, needApproval, needWrap)
                    }
                    else {
                      this.setStepsModalInfo(-1, needApproval, needWrap)
                    }
                  })
                  .catch(() => {
                    this.setStepsModalInfo(-1, needApproval, needWrap)
                  })
                }
                else {
                  this.setStepsModalInfo(-1, needApproval, needWrap)
                }
              })
              .catch(() => {
                this.setStepsModalInfo(-1, needApproval, needWrap)
              })
          }
          else {
            this.afterWrap(stepNumber + 2, nonce, needApproval, needWrap)
          }
        })
      })
    })
  }

  afterWrap = (stepNumber, nonce, needApproval, needWrap) => {
    if (needApproval) {
      this.setStepsModalInfo(++stepNumber, needApproval, needWrap)
      allowDeposit(this.context.web3.selectedAccount, maxAllowance, this.getAsset(), acoOtcAddress(), nonce)
        .then(result => {
          if (result) {
            this.setStepsModalInfo(++stepNumber, needApproval, needWrap)
            checkTransactionIsMined(result).then(result => {
              if (result) {
                this.sendCreateOrderTransaction(stepNumber, ++nonce, needApproval, needWrap)
              }
              else {
                this.setStepsModalInfo(-1, needApproval, needWrap)
              }
            })
            .catch(() => {
              this.setStepsModalInfo(-1, needApproval, needWrap)
            })
          }
          else {
            this.setStepsModalInfo(-1, needApproval, needWrap)
          }
        })
        .catch(() => {
          this.setStepsModalInfo(-1, needApproval, needWrap)
        })
    }
    else {
      this.sendCreateOrderTransaction(stepNumber + 2, nonce, needApproval, needWrap)
    }
  }

  needWrapValue = () => {
    return new Promise((resolve) => {
      if (this.getAsset() === wethAddress()) {
        getBalanceOfAsset(wethAddress(), this.context.web3.selectedAccount).then(result => {
          var resultValue = new Web3Utils.BN(result)
          resolve(this.getAssetValue().sub(resultValue))
        })
      }
      else {
        resolve(zero)
      }
    })
  }

  getAsset = () => {
    var isCall = this.props.createOrderData.selectedOption.selectedType === 1
    if (this.props.createOrderData.isAsk && isCall) {
      return isEther(this.props.createOrderData.selectedOption.selectedUnderlying.address) ?  wethAddress() : this.props.createOrderData.selectedOption.selectedUnderlying.address
    }
    else {
      return usdcAddress()
    }
  }

  getAssetSymbol = () => {
    var isCall = this.props.createOrderData.selectedOption.selectedType === 1
    if (this.props.createOrderData.isAsk && isCall) {
      return isEther(this.props.createOrderData.selectedOption.selectedUnderlying.address) ?  "WETH" : this.props.createOrderData.selectedOption.selectedUnderlying.symbol
    }
    else {
      return "USDC"
    }
  }

  getAssetValue = () => {
    if (this.props.createOrderData.isAsk) {
      var isCall = this.props.createOrderData.selectedOption.selectedType === 1
      if (isCall) {
        return this.props.createOrderData.optionQty
      }
      else {
        return new Web3Utils.BN(fromDecimals(toDecimals(this.props.createOrderData.selectedOption.strikeValue, 6).mul(this.props.createOrderData.optionQty), this.props.createOrderData.selectedOption.selectedUnderlying.decimals, 0, 0))
      }
    }
    else {
      return this.props.createOrderData.usdcValue
    }
  }

  getUSDCToCollaterize = () => {
    return this.props.createOrderData.optionQty * this.props.createOrderData.selectedOption.strikeValue
  }

  needApprove = () => {
    return new Promise((resolve) => {
      allowance(this.context.web3.selectedAccount, this.getAsset(), acoOtcAddress()).then(result => {
        var resultValue = new Web3Utils.BN(result)
        resolve(resultValue.lt(this.getAssetValue()))
      })
    })
  }

  sendCreateOrderTransaction = (stepNumber, nonce, needApproval, needWrap) => {
    this.setStepsModalInfo(++stepNumber, needApproval)
    signOrder(this.context.web3.selectedAccount, this.props.createOrderData.isAsk, this.props.createOrderData.selectedOption, 
      this.props.createOrderData.optionQty, this.props.createOrderData.usdcValue, this.props.createOrderData.expiry, 
      this.props.createOrderData.counterpartyAddress)
    .then((signedOrder) => {
      if (signedOrder) {
        this.setStepsModalInfo(++stepNumber, needApproval, needWrap)
        createOtcOrder(this.props.createOrderData.isAsk, signedOrder)
        .then(result => {
          if (result) {    
            this.props.onCreated(result)
          }
          else {
            this.setStepsModalInfo(-1, needApproval, needWrap)
          }
        })
        .catch(() => {
          this.setStepsModalInfo(-1, needApproval, needWrap)
        })
      }
      else {
        this.setStepsModalInfo(-1, needApproval, needWrap)
      }
    })
    .catch(() => {
      this.setStepsModalInfo(-1, needApproval, needWrap)
    })
  }

  setStepsModalInfo = (stepNumber, needApproval, needWrap) => {
    var title = ""
    if (stepNumber <= 2) {
      title = "Wrap ETH"
    }
    else if (stepNumber <= 4) {
      title = "Unlock token"
    }
    else {
      title = "Sign"
    }
    
    var subtitle = ""
    var img = null
    var assetSymbol =  this.getAssetSymbol()
    if (needWrap && stepNumber === 1) {
      subtitle = "Confirm on " + this.context.web3.name + " to wrap ETH."
      img = <MetamaskLargeIcon />
    }
    else if (needWrap && stepNumber === 2) {
      subtitle = "Wrapping ETH..."
      img = <SpinnerLargeIcon />
    }
    else if (needApproval && stepNumber === 3) {
      subtitle = "Confirm on " + this.context.web3.name + " to unlock " + assetSymbol + "."
      img = <MetamaskLargeIcon />
    }
    else if (needApproval && stepNumber === 4) {
      subtitle = "Unlocking " + assetSymbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 5) {
      subtitle = "Confirm on " + this.context.web3.name + " to sign the OTC order."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 6) {
      subtitle = "Saving OTC order..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 7) {
      subtitle = "You have successfully create your OTC order."
      img = <DoneLargeIcon />
    }
    else if (stepNumber === -1) {
      title = ""
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon />
    }

    var steps = []
    if (needWrap) {
      steps.push({ title: "Wrap ETH", progress: stepNumber > 2 ? 100 : 0, active: true })
    }
    if (needApproval) {
      steps.push({ title: "Unlock", progress: stepNumber > 4 ? 100 : 0, active: stepNumber >= 3 ? true : false })
    }
    steps.push({ title: "Sign", progress: stepNumber > 6 ? 100 : 0, active: stepNumber >= 5 ? true : false })
    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        steps: steps,
        img: img,
        isDone: (stepNumber === 7 || stepNumber === -1),
        onDoneButtonClick: this.onHideStepsModal
      }
    })
  }

  onHideStepsModal = () => {
    this.setState({ stepsModalInfo: null })
    this.props.onHide()
  }

  render() {
    return (<>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
      </>
    )
  }
}

CreateOrderModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(CreateOrderModal)