import './DepositVaultModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { checkTransactionIsMined, getNextNonce } from '../../util/web3Methods'
import StepsModal from '../StepsModal/StepsModal'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { deposit } from '../../util/acoVaultMethods'
import { allowance, allowDeposit } from '../../util/erc20Methods'
import { maxAllowance } from '../../util/constants'
import Web3Utils from 'web3-utils'

class DepositVaultModal extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount = () => {
    this.onStartDeposit()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }
  
  getDepositAsset = () => {
    return this.props.info.depositAsset
  }
  
  needApprove = () => {
    return new Promise((resolve) => {
      allowance(this.context.web3.selectedAccount, this.getDepositAsset(), this.props.info.address).then(result => {
        var resultValue = new Web3Utils.BN(result)
        resolve(resultValue.lt(new Web3Utils.BN(this.props.info.amount)))
      })
    })
  }

  onStartDeposit = () => {
    getNextNonce(this.context.web3.selectedAccount).then(nonce => {
      var stepNumber = 0
      this.needApprove().then(needApproval => {
        if (needApproval) {
          this.setStepsModalInfo(++stepNumber, needApproval)
          allowDeposit(this.context.web3.selectedAccount, maxAllowance, this.getDepositAsset(), this.props.info.address, nonce)
            .then(result => {
              if (result) {
                this.setStepsModalInfo(++stepNumber, needApproval)
                checkTransactionIsMined(result).then(result => {
                  if (result) {
                    this.sendDepositTransaction(stepNumber, ++nonce, needApproval)
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
          this.sendDepositTransaction(stepNumber, nonce, needApproval)
        }
      })
    })
  }

  sendDepositTransaction = (stepNumber, nonce, needApproval) => {
    this.setStepsModalInfo(++stepNumber, needApproval)
    deposit(this.context.web3.selectedAccount, this.props.info.address, this.props.info.amount, nonce)
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

  getDepositAssetSymbol = () => {
    return this.props.info.depositAssetSymbol
  }

  setStepsModalInfo = (stepNumber, needApproval) => {
    var title = (needApproval && stepNumber <= 2) ? "Unlock token" : "Deposit"
    var subtitle = ""
    var img = null
    var depositAssetSymbol =  this.getDepositAssetSymbol()
    if (needApproval && stepNumber === 1) {
      subtitle = "Confirm on " + this.context.web3.name + " to unlock " + depositAssetSymbol + "."
      img = <MetamaskLargeIcon />
    }
    else if (needApproval && stepNumber === 2) {
      subtitle = "Unlocking " + depositAssetSymbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = "Confirm on " + this.context.web3.name + " to deposit " + this.props.info.depositValue + " " + depositAssetSymbol  + "."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 4) {
      subtitle = "Sending " + this.props.info.depositValue + " " + depositAssetSymbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 5) {
      subtitle = "You have successfully deposited."
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
    steps.push({ title: "Deposit", progress: stepNumber > 4 ? 100 : 0, active: stepNumber >= 3 ? true : false })
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

  onDoneButtonClick = () => {
    this.setState({ stepsModalInfo: null })    
    this.props.onHide(true)
  }

  onHideStepsModal = () => {
    this.setState({ stepsModalInfo: null })
    this.props.onHide(false)
  }

  render() {
    return (<>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal}></StepsModal>}
      </>
    )
  }
}

DepositVaultModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(DepositVaultModal)