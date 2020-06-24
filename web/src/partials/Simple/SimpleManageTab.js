import './SimpleManageTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import WrittenOptionsPositions from '../Write/WrittenOptionsPositions'
import Burn from '../Write/Burn'
import ExercisePositions from '../Exercise/ExercisePositions'
import ExerciseModal from '../Exercise/ExerciseModal'

class SimpleManageTab extends Component {
  constructor(props) {
    super(props)
    this.state = {position: null }
  }

  onCancelClick = () => {
    this.setState({burnPosition: null, exercisePosition: null})
  }

  onBurnPositionSelect = (position) => {
    this.setState({burnPosition: position, exercisePosition: null})
  }

  onExercisePositionSelect = (position) => {
    this.setState({burnPosition: null, exercisePosition: position})
  }

  render() {
    return <div className="simple-manage-tab">
      {!this.state.burnPosition && !this.state.exercisePosition &&
      <> 
        <WrittenOptionsPositions {...this.props} onBurnPositionSelect={this.onBurnPositionSelect}></WrittenOptionsPositions>
        <div class="page-title">MANAGE LONG OPTIONS POSITIONS</div>
        <ExercisePositions {...this.props} setPosition={this.onExercisePositionSelect} refresh={this.state.refresh} updated={() => this.setState({refresh: false})}></ExercisePositions>
      </>
      }
      {this.state.burnPosition && <Burn {...this.props} position={this.state.burnPosition} onCancelClick={this.onCancelClick}></Burn>}
      {this.state.exercisePosition && <ExerciseModal {...this.props} position={this.state.exercisePosition} onHide={(shouldRefresh) => this.onCancelClick(shouldRefresh)}></ExerciseModal>}
      
    </div>
  }
}

SimpleManageTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(SimpleManageTab)