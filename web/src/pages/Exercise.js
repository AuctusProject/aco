import './Exercise.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import ExercisePositions from '../partials/Exercise/ExercisePositions'
import ExerciseAction from '../partials/Exercise/ExerciseAction'
import Loading from '../partials/Util/Loading'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'

class Exercise extends Component {
  constructor() {
    super()
    this.state = { position: null}
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

  onCancelClick = () => {
    this.setPosition(null)
  }

  render() {
    return <div className="py-4">
      {this.canLoad() && <>
        <div className="beta-alert"><FontAwesomeIcon icon={faExclamationCircle}></FontAwesomeIcon>This project is in beta. Use at your own risk.</div>
        {this.props.selectedPair && this.state.position === null && <div className="page-title">EXERCISE</div>}
        {this.props.selectedPair && this.state.position === null && <div className="page-subtitle">Select which option series you would like to exercise</div>}
        {!this.props.selectedPair && <Loading/>}
        {this.props.selectedPair && this.state.position === null && <ExercisePositions {...this.props} setPosition={this.setPosition}></ExercisePositions>}
        {this.props.selectedPair && this.state.position !== null && <ExerciseAction {...this.props} position={this.state.position} onCancelClick={this.onCancelClick}></ExerciseAction>}
      </>}
      </div>
  }
}

Exercise.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Exercise)