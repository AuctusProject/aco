import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { checkTransactionIsMined } from '../util/web3Methods'
import StepsModal from './StepsModal/StepsModal'
import MetamaskLargeIcon from './Util/MetamaskLargeIcon'
import SpinnerLargeIcon from './Util/SpinnerLargeIcon'
import DoneLargeIcon from './Util/DoneLargeIcon'
import ErrorLargeIcon from './Util/ErrorLargeIcon'
import { newAcoToken } from '../util/acoFactoryMethods'

class CreateOptionModal extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount = () => {
    this.onCreateOption()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  onCreateOption = () => {
    var stepNumber = 0
    this.setStepsModalInfo(++stepNumber)
    newAcoToken(this.context.web3.selectedAccount, this.props.optionData.underlying, this.props.optionData.strikeAsset, this.props.optionData.isCall,this.props.optionData.strikePrice, this.props.optionData.expiryTime)
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
    var title = "Create Option"
    var subtitle = ""
    var img = null
    if (stepNumber === 1) {
      subtitle = "Confirm on Metamask to create option."
      img = <MetamaskLargeIcon />
    }
    else if (stepNumber === 2) {
      subtitle = "Creating option..."
      img = <SpinnerLargeIcon />
    }
    else if (stepNumber === 3) {
      subtitle = "You have successfully created the option."
      img = <DoneLargeIcon />
    }
    else if (stepNumber === -1) {
      title = ""
      subtitle = "An error ocurred. Please try again."
      img = <ErrorLargeIcon />
    }

    var steps = []
    steps.push({ title: "Create", progress: stepNumber > 2 ? 100 : 0, active: true })
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

CreateOptionModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(CreateOptionModal)