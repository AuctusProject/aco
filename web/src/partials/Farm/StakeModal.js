import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { checkTransactionIsMined, getNextNonce } from '../../util/web3Methods'
import StepsModal from '../StepsModal/StepsModal'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { allowance, allowDeposit } from '../../util/erc20Methods'
import { acoRewardAddress, maxAllowance, toDecimals } from '../../util/constants'
import { deposit } from '../../util/acoRewardsMethods'
import Web3Utils from 'web3-utils'

class StakeModal extends Component {
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
  
  needApprove = () => {
    return new Promise((resolve) => {
      allowance(this.context.web3.selectedAccount, this.props.data.pool.address, acoRewardAddress).then(result => {
        var resultValue = new Web3Utils.BN(result)
        resolve(resultValue.lt(new Web3Utils.BN(toDecimals(this.props.data.stakeValue, this.props.data.pool.decimals))))
      })
    })
  }

  onStartDeposit = () => {
    getNextNonce(this.context.web3.selectedAccount).then(nonce => {
      var stepNumber = 0
      this.needApprove().then(needApproval => {
        if (needApproval) {
          this.setStepsModalInfo(++stepNumber, needApproval)
          allowDeposit(this.context.web3.selectedAccount, maxAllowance, this.props.data.pool.address, acoRewardAddress, nonce)
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
    deposit(this.context.web3.selectedAccount, this.props.data.pool.pid, toDecimals(this.props.data.stakeValue, this.props.data.pool.decimals), nonce)
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
    return this.props.data.pool.name
  }

  setStepsModalInfo = (stepNumber, needApproval) => {
    var title = (needApproval && stepNumber <= 2) ? "Unlock token" : "Stake"
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
      subtitle = "Confirm on " + this.context.web3.name + " to stake " + this.props.data.stakeValue + " " + depositAssetSymbol  + "."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 4) {
      subtitle = "Staking " + this.props.data.stakeValue + " " + depositAssetSymbol + "..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 5) {
      subtitle = "You have successfully staked."
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
    steps.push({ title: "Stake", progress: stepNumber > 4 ? 100 : 0, active: stepNumber >= 3 ? true : false })
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
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal} />}
      </>
    )
  }
}

StakeModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(StakeModal)