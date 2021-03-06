import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { checkTransactionIsMined, getNextNonce } from '../../util/web3Methods'
import StepsModal from '../StepsModal/StepsModal'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { AdvancedOrderStepsType, maxAllowance } from '../../util/constants'
import { allowDeposit } from '../../util/contractHelpers/erc20Methods'
import { buy, sell } from '../../util/acoSwapUtil'
import { getSignedOrder } from '../../util/Zrx/zrxUtils'
import { postOrder } from '../../util/Zrx/zrxApi'
import { mint } from '../../util/contractHelpers/acoTokenMethods'

class CreateAdvancedOrderModal extends Component {
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

  onCreateOrder = async () => {
    var from = this.context.web3.selectedAccount
    getNextNonce(from).then(nonce => {
        this.nextStepCall(0, nonce)
    })
  }

  setStepError = (currentStep) => {
    this.setStepsModalInfo(currentStep, false, false, true)
  }

  nextStepCall = (index, nonce) => {
    var from = this.context.web3.selectedAccount
    if (index >= this.props.steps.length) {      
      this.setStepsModalInfo(this.props.steps[this.props.steps.length-1], false, true, false)
    }
    else {
      var currentStep = this.props.steps[index]
      this.setStepsModalInfo(currentStep)
      switch (currentStep.type) {
        case AdvancedOrderStepsType.LimitApprove:
        case AdvancedOrderStepsType.MarketApprove:
        case AdvancedOrderStepsType.MintApprove: {
          allowDeposit(from, maxAllowance, currentStep.token, currentStep.address, nonce).then(result => {
            this.checkTransactionResult(result, currentStep, index, nonce)
          })
          .catch(() => {
            this.setStepError(currentStep)
          })
          break;
        }
        case AdvancedOrderStepsType.BuySellMarket: {
          var buySellPromise;
          if (currentStep.isBuy) {
            buySellPromise = buy(from, nonce, currentStep.quote.zrxData, currentStep.quote.poolData, currentStep.quote.option)
          }
          else {
            buySellPromise = sell(from, nonce, currentStep.quote.zrxData)
          }
          buySellPromise.then(result => {
            this.checkTransactionResult(result, currentStep, index, nonce)
          })
          .catch(() => {
            this.setStepError(currentStep)
          })
          break;
        }
        case AdvancedOrderStepsType.BuySellLimit: {
          getSignedOrder(from, currentStep.order).then(result => {
            this.setStepsModalInfo(currentStep, true)
            postOrder(result).then(
              this.setStepsModalInfo(currentStep, true, true, false)
            )
            .catch(() => {
              this.setStepError(currentStep)
            })
          })
          .catch(() => {
            this.setStepError(currentStep)
          })
          break;
        }
        case AdvancedOrderStepsType.Mint: {
          mint(this.context.web3.selectedAccount, currentStep.option, currentStep.mintValue, nonce)
          .then(result => {
            this.checkTransactionResult(result, currentStep, index, nonce)
          })
          .catch(() => {
            this.setStepError(currentStep)
          })
          break;
        }
        default:
          break;
      }
    }
  }

  getTitle = (step) => {
    switch (step.type) {
      case AdvancedOrderStepsType.LimitApprove:
      case AdvancedOrderStepsType.MarketApprove: 
      case AdvancedOrderStepsType.MintApprove: {
          return "Unlock"
      }
      case AdvancedOrderStepsType.BuySellMarket: {
        return step.isBuy ? "Buy" : "Sell"
      }
      case AdvancedOrderStepsType.BuySellLimit: {
        return "Sign"
      }
      case AdvancedOrderStepsType.Mint: {
        return "Mint"
      }
      default:
        break;
    }
  }

  getSubtitle = (step, isPending, isDone, isError) => {
    if (isDone) {
      if (step.type === AdvancedOrderStepsType.Mint) {
        return "You have successfully minted options. Proceed to place your order."
      }
      else {
        return "You have placed your order."
      }
    }
    else if (isError) {
      return "An error ocurred. Please try again."
    }

    switch (step.type) {
      case AdvancedOrderStepsType.LimitApprove:
      case AdvancedOrderStepsType.MarketApprove: {       
        if (isPending) {
          return "Waiting unlock confirmation..."
        }
        return "Confirm on " + this.context.web3.name + " to unlock."
      }
      case AdvancedOrderStepsType.MintApprove: {
        if (isPending) {
          return "Waiting unlock confirmation..."
        }
        return "Before placing your order, you need to mint options. Confirm on " + this.context.web3.name + " to unlock the collateral."
      }
      case AdvancedOrderStepsType.BuySellMarket: {
        if (isPending) {
          return "Submitting order..."
        }
        return "Confirm on " + this.context.web3.name + " to "+(step.isBuy ? "buy." : "sell.")
      }
      case AdvancedOrderStepsType.BuySellLimit: {
        if (isPending) {
          return "Submitting order..."
        }
        return "Confirm signature on " + this.context.web3.name + " to submit limit order."
      }
      case AdvancedOrderStepsType.Mint: {
        if (isPending) {
          return "Waiting confirmation..."
        }
        return "Before placing your order, you need to mint options. Confirm on " + this.context.web3.name + " to mint."
      }
      default:
        break;
    }
  }

  getImg = (isPending, isDone, isError) => {
    if (isDone) {
      return <DoneLargeIcon />
    }
    else if(isError) {
      return <ErrorLargeIcon />
    }
    else if (isPending) {
      return <SpinnerLargeIcon />
    }
    else {
      return <MetamaskLargeIcon />
    }
  }

  setStepsModalInfo = (currentStep, isPending, isDone, isError) => {
    var title = (currentStep.type === AdvancedOrderStepsType.Mint || currentStep.type === AdvancedOrderStepsType.MintApprove) ? "Mint Options" :  "Place Order"
    var subtitle = this.getSubtitle(currentStep, isPending, isDone, isError)
    var img = this.getImg(isPending, isDone, isError)
    var steps = []
    
    for (let i = 0; i < this.props.steps.length; i++) {
      const step = this.props.steps[i];
      var stepTitle = this.getTitle(step)
      var currentStepIndex = this.props.steps.indexOf(currentStep)      
      var isActive = currentStepIndex >= i
      var isCompleted = currentStepIndex > i
      steps.push({ title: stepTitle, progress: isCompleted ? 100 : 0, active: isActive })
    }

    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        steps: steps,
        img: img,
        isDone: isDone || isError,
        onDoneButtonClick: this.onHideStepsModal(isDone)
      }
    })
  }

  onHideStepsModal = (isDone) => () => {
    this.setState({ stepsModalInfo: null })
    this.props.onHide(isDone)
  }

  checkTransactionResult(result, currentStep, index, nonce) {
    if (result) {
      this.setStepsModalInfo(currentStep, true)
      checkTransactionIsMined(result).then(result => {
        if (result) {
          this.nextStepCall(++index, ++nonce)
        }
        else {
          this.setStepError(currentStep)
        }
      })
      .catch(() => {
        this.setStepError(currentStep)
      })
    }
    else {
      this.setStepError(currentStep)
    }
  }

  render() {
    return (<>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
      </>
    )
  }
}

CreateAdvancedOrderModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(CreateAdvancedOrderModal)