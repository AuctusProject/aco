import './Exercise.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import ExercisePositions from '../partials/Exercise/ExercisePositions'
import ExerciseModal from '../partials/Exercise/ExerciseModal'
import Loading from '../partials/Util/Loading'
import { PositionsLayoutMode } from '../util/constants'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'

class Exercise extends Component {
  constructor() {
    super()
    this.state = {position: null, refresh: false}
  }

  isLogged = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount
  }

  setPosition = (position) => {
    this.setState({position: position})
  }

  onCancelClick = (shouldRefresh) => {
    this.setState({position: null, refresh: !!shouldRefresh})
  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  render() {
    return <div className="p-4">
      <div className="beta-alert"><FontAwesomeIcon icon={faExclamationCircle}/>Exercise is not automatic, please remember manually exercising in-the-money options before expiration.</div>
      {this.props.selectedPair && <div className="page-title">EXERCISE</div>}
      {this.isLogged() && this.props.selectedPair && <div className="page-subtitle">Select which option series you would like to exercise</div>}
      {!this.isLogged() && <><div className="page-subtitle">Connect your account to load your wallet information.</div>
        <div className="action-button-wrapper">
          <div className="action-btn medium solid-blue" onClick={this.onConnectClick}>
            <div>CONNECT WALLET</div>
          </div>
        </div>
      </>}
      {!this.props.selectedPair && <Loading/>}
      {this.props.selectedPair && <ExercisePositions {...this.props} mode={PositionsLayoutMode.Advanced} setPosition={this.setPosition} refresh={this.state.refresh} updated={() => this.setState({refresh: false})}></ExercisePositions>}
      {this.props.selectedPair && this.state.position !== null && <ExerciseModal {...this.props} position={this.state.position} onHide={(shouldRefresh) => this.onCancelClick(shouldRefresh)}></ExerciseModal>}
    </div>
  }
}

Exercise.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Exercise)