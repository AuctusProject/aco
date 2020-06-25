import './SimpleManageTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import WrittenOptionsPositions from '../Write/WrittenOptionsPositions'
import BurnModal from '../Write/BurnModal'
import ExercisePositions from '../Exercise/ExercisePositions'
import ExerciseModal from '../Exercise/ExerciseModal'

class SimpleManageTab extends Component {
  constructor(props) {
    super(props)
    this.state = {position: null, refreshExercise: false, refreshWrite: false}
  }

  onCancelWriteClick = (shouldRefresh) => {
    this.setState({burnPosition: null, refreshWrite: !!shouldRefresh})
  }

  onCancelExerciseClick = (shouldRefresh) => {
    this.setState({exercisePosition: null, refreshExercise: !!shouldRefresh})
  }

  onBurnPositionSelect = (position) => {
    this.setState({burnPosition: position, exercisePosition: null})
  }

  onExercisePositionSelect = (position) => {
    this.setState({burnPosition: null, exercisePosition: position})
  }

  render() {
    return <div className="simple-manage-tab">
      <WrittenOptionsPositions {...this.props} onBurnPositionSelect={this.onBurnPositionSelect} refresh={this.state.refreshWrite} updated={() => this.setState({refreshWrite: false})}></WrittenOptionsPositions>
      <div className="page-title">MANAGE LONG OPTIONS POSITIONS</div>
      <ExercisePositions {...this.props} setPosition={this.onExercisePositionSelect} refresh={this.state.refreshExercise} updated={() => this.setState({refreshExercise: false})}></ExercisePositions>

      {this.state.burnPosition && <BurnModal {...this.props} position={this.state.burnPosition} onHide={(shouldRefresh) => this.onCancelWriteClick(shouldRefresh)}></BurnModal>}
      {this.state.exercisePosition && <ExerciseModal {...this.props} position={this.state.exercisePosition} onHide={(shouldRefresh) => this.onCancelExerciseClick(shouldRefresh)}></ExerciseModal>}
      
    </div>
  }
}

SimpleManageTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(SimpleManageTab)