import './Exercise.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import ExercisePositions from '../partials/Exercise/ExercisePositions'
import ExerciseModal from '../partials/Exercise/ExerciseModal'
import Loading from '../partials/Util/Loading'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { PositionsLayoutMode } from '../util/constants'

class Exercise extends Component {
  constructor() {
    super()
    this.state = {position: null, refresh: false}
  }

  
  componentDidMount = () => {
    if (!this.canLoad()) {
      this.props.history.push('/')
    }
  }

  canLoad = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }

  setPosition = (position) => {
    this.setState({position: position})
  }

  onCancelClick = (shouldRefresh) => {
    this.setState({position: null, refresh: !!shouldRefresh})
  }

  render() {
    return <div className="py-4">
      {this.canLoad() && <>
        {this.props.selectedPair && <div className="page-title">EXERCISE</div>}
        {this.props.selectedPair && <div className="page-subtitle">Select which option series you would like to exercise</div>}
        {!this.props.selectedPair && <Loading/>}
        {this.props.selectedPair && <ExercisePositions {...this.props} mode={PositionsLayoutMode.Advanced} setPosition={this.setPosition} refresh={this.state.refresh} updated={() => this.setState({refresh: false})}></ExercisePositions>}
        {this.props.selectedPair && this.state.position !== null && <ExerciseModal {...this.props} position={this.state.position} onHide={(shouldRefresh) => this.onCancelClick(shouldRefresh)}></ExerciseModal>}
      </>}
      </div>
  }
}

Exercise.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Exercise)