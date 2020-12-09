import './OtcManageTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'

class OtcManageTab extends Component {
  constructor(props) {
    super(props)
    this.state = { position: null, writtenPositions: null, exercisePositions: null, refreshExercise: false, refreshWrite: false}
  }

  onCancelBurnClick = (shouldRefresh) => {
    this.setState({burnPosition: null, refreshWrite: !!shouldRefresh})
  }

  onCancelExerciseClick = (shouldRefresh) => {
    this.setState({exercisePosition: null, refreshExercise: !!shouldRefresh})
  }

  onCancelSellClick = (shouldRefresh) => {
    this.setState({sellPosition: null, refreshExercise: !!shouldRefresh})
  }

  onBurnPositionSelect = (position) => {
    this.setState({burnPosition: position, exercisePosition: null, sellPosition: null})
  }

  onExercisePositionSelect = (position) => {
    this.setState({burnPosition: null, exercisePosition: position, sellPosition: null})
  }

  onSellPositionSelect = (position) => {
    this.setState({burnPosition: null, exercisePosition: null, sellPosition: position})
  }
  
  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  loadedExercisePositions = (positions) => {
    this.setState({exercisePositions: positions})
  }

  loadedWrittenPositions = (positions) => {
    this.setState({writtenPositions: positions})
  }

  render() {
    return <div className="otc-manage-tab">
      
    </div>
  }
}

OtcManageTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(OtcManageTab)