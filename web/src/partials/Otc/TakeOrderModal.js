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
import { acoOtcAddress, fromDecimals, getBalanceOfAsset, isEther, maxAllowance, toDecimals, usdcAddress, wethAddress, zero } from '../../util/constants'
import { allowance, allowDeposit } from '../../util/erc20Methods'
import { swapAskOrder, swapBidOrder } from '../../util/acoOtcMethods'

class TakeOrderModal extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount = () => {
    this.onTakeTrade()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  onTakeTrade = () => {
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
      allowDeposit(this.context.web3.selectedAccount, maxAllowance, this.getAsset(), acoOtcAddress, nonce)
        .then(result => {
          if (result) {
            this.setStepsModalInfo(++stepNumber, needApproval, needWrap)
            checkTransactionIsMined(result).then(result => {
              if (result) {
                this.sendTakeTradeTransaction(stepNumber, ++nonce, needApproval, needWrap)
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
      this.sendTakeTradeTransaction(stepNumber + 2, nonce, needApproval, needWrap)
    }
  }

  needWrapValue = () => {
    return new Promise((resolve) => {
      if (this.getAsset() === wethAddress) {
        getBalanceOfAsset(wethAddress, this.context.web3.selectedAccount).then(result => {
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
    var isCall = this.props.orderData.isCall
    if (!this.props.orderData.isAskOrder && isCall) {
      return isEther(this.props.orderData.underlying.address) ?  wethAddress : this.props.orderData.underlying.address
    }
    else {
      return usdcAddress
    }
  }

  getAssetSymbol = () => {
    var isCall = this.props.orderData.isCall
    if (!this.props.orderData.isAskOrder && isCall) {
      return isEther(this.props.orderData.underlying.address) ?  "WETH" : this.props.orderData.underlying.symbol
    }
    else {
      return "USDC"
    }
  }

  getAssetValue = () => {
    if (!this.props.orderData.isAskOrder) {
      var isCall = this.props.orderData.isCall
      if (isCall) {
        return new Web3Utils.BN(this.props.orderData.optionQty)
      }
      else {
        return new Web3Utils.BN(fromDecimals(toDecimals(this.props.orderData.strikeValue, 6).mul(this.props.orderData.optionQty), this.props.orderData.underlying.decimals, 0, 0))
      }
    }
    else {
      return new Web3Utils.BN(this.props.orderData.usdcValue)
    }
  }

  getUSDCToCollaterize = () => {
    return this.props.orderData.optionQty * this.props.orderData.strikeValue
  }

  needApprove = () => {
    return new Promise((resolve) => {
      allowance(this.context.web3.selectedAccount, this.getAsset(), acoOtcAddress).then(result => {
        var resultValue = new Web3Utils.BN(result)
        resolve(resultValue.lt(this.getAssetValue()))
      })
    })
  }

  sendTakeTradeTransaction = (stepNumber, nonce, needApproval, needWrap) => {
    this.setStepsModalInfo(++stepNumber, needApproval)
    let swapMethod = this.props.orderData.isAskOrder ? swapAskOrder : swapBidOrder
    swapMethod(this.context.web3.selectedAccount, this.props.orderData.order, nonce)
    .then(result => {
      if (result) {
        this.setStepsModalInfo(++stepNumber, needApproval, needWrap)
        checkTransactionIsMined(result).then(result => {
          if (result) {
            this.setStepsModalInfo(++stepNumber, needApproval, needWrap)
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
      title = "Swap"
    }
    
    var subtitle = ""
    var img = null
    var assetSymbol =  this.getAssetSymbol()
    if (needWrap && stepNumber === 1) {
      subtitle = "Confirm on Metamask to wrap ETH."
      img = <MetamaskLargeIcon />
    }
    else if (needWrap && stepNumber === 2) {
      subtitle = "Wrapping ETH..."
      img = <SpinnerLargeIcon />
    }
    else if (needApproval && stepNumber === 3) {
      subtitle = "Confirm on Metamask to unlock " + assetSymbol + "."
      img = <MetamaskLargeIcon />
    }
    else if (needApproval && stepNumber === 4) {
      subtitle = "Unlocking " + assetSymbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 5) {
      subtitle = "Confirm on Metamask to execute OTC order."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 6) {
      subtitle = "Executing OTC order..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 7) {
      subtitle = "You have successfully executed the OTC order."
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
    steps.push({ title: "Swap", progress: stepNumber > 6 ? 100 : 0, active: stepNumber >= 5 ? true : false })
    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        steps: steps,
        img: img,
        isDone: (stepNumber === 7 || stepNumber === -1),
        onDoneButtonClick: (stepNumber === 7 ? this.onDone : this.onHideStepsModal)
      }
    })
  }

  onDone = () => {
    this.setState({ stepsModalInfo: null })
    this.props.onHide(true)
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

TakeOrderModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(TakeOrderModal)