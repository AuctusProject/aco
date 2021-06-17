import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { checkTransactionIsMined } from '../../util/web3Methods'
import StepsModal from '../StepsModal/StepsModal'
import MetamaskLargeIcon from '../Util/MetamaskLargeIcon'
import SpinnerLargeIcon from '../Util/SpinnerLargeIcon'
import DoneLargeIcon from '../Util/DoneLargeIcon'
import ErrorLargeIcon from '../Util/ErrorLargeIcon'
import { cancelLimitOrder } from '../../util/Zrx/zrxWeb3'

class CancelAdvancedOrderModal extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount = () => {
    this.onCancelOrder()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  onCancelOrder = () => {
    var stepNumber = 0
    this.setStepsModalInfo(++stepNumber)
    cancelLimitOrder(this.context.web3.selectedAccount, this.props.cancelOrderData)
    .then((result) => {
      if (result) {
        this.setStepsModalInfo(++stepNumber)
        checkTransactionIsMined(result).then(result => {
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
    var title = "Cancel Order"
    var subtitle = ""
    var img = null
    if (stepNumber === 1) {
      subtitle = "Confirm on " + this.context.web3.name + " to cancel order."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 2) {
      subtitle = "Canceling order..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = "You have successfully canceled your order."
      img = <DoneLargeIcon />
    }
    else if (stepNumber === -1) {
      title = ""
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon />
    }

    var steps = []
    steps.push({ title: "Cancel", progress: stepNumber > 2 ? 100 : 0, active: true })
    this.setState({
      stepsModalInfo: {
        title: title,
        subtitle: subtitle,
        steps: steps,
        img: img,
        isDone: (stepNumber === 3 || stepNumber === -1),
        onDoneButtonClick: this.onHideStepsModal(stepNumber === 3)
      }
    })
  }

  onHideStepsModal = (completed) => () => {
    this.setState({ stepsModalInfo: null })
    this.props.onHide(completed)
  }

  render() {
    return (<>
      {this.state.stepsModalInfo && <StepsModal {...this.state.stepsModalInfo} onHide={this.onHideStepsModal(false)}></StepsModal>}
      </>
    )
  }
}

CancelAdvancedOrderModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(CancelAdvancedOrderModal)