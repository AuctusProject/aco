import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { checkTransactionIsMined } from '../../util/web3Methods'
import StepsModal from '../StepsModal/StepsModal'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { withdraw } from '../../util/acoRewardsMethods'
import { toDecimals } from '../../util/constants'

class UnstakeModal extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount = () => {
    this.onStartExit()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  onStartExit = () => {
    var stepNumber = 0
    this.setStepsModalInfo(++stepNumber)
    withdraw(this.context.web3.selectedAccount, this.props.data.pool.pid, toDecimals(this.props.data.unstakeValue, 18))
      .then(result => {
        if (result) {
          this.setStepsModalInfo(++stepNumber)
          checkTransactionIsMined(result)
            .then(result => {
              if (result) {
                this.setStepsModalInfo(++stepNumber)
              }
              else {
                this.setStepsModalInfo(-1)
              }
            })
            .catch(() => {
              this.setStepsModalInfo(-1)
            })
        }
        else {
          this.setStepsModalInfo(-1)
        }
      })
      .catch(() => {
        this.setStepsModalInfo(-1)
      })
  }

  setStepsModalInfo = (stepNumber) => {
    var title = this.props.data.isExit ? "Exit" : "Unstake"
    var subtitle = ""
    var img = null
    if (stepNumber === 1) {
      subtitle = `Confirm on Metamask to ${(this.props.data.isExit ? "exit": "unstake")}.`
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 2) {
      subtitle = `${(this.props.data.isExit ? "Exiting": "Unstaking")}...`
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = `You have successfully ${(this.props.data.isExit ? "exited": "unstaked")}.`
      img = <DoneLargeIcon />
    }
    else if (stepNumber === -1) {
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon />
    }

    var steps = []
    steps.push({ title: title, progress: stepNumber > 2 ? 100 : 0, active: true })
    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        steps: steps,
        img: img,
        isDone: (stepNumber === 3 || stepNumber === -1),
        onDoneButtonClick: (stepNumber === 3 ? this.onDoneButtonClick : this.onHideStepsModal)
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

UnstakeModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(UnstakeModal)