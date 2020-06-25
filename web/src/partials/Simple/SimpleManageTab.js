import './SimpleManageTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import WrittenOptionsPositions from '../Write/WrittenOptionsPositions'
import Burn from '../Write/Burn'
import ExercisePositions from '../Exercise/ExercisePositions'
import ExerciseModal from '../Exercise/ExerciseModal'
import { PositionsLayoutMode } from '../../util/constants'
import Loading from '../Util/Loading'
import SimpleSellModal from './SimpleSellModal'

class SimpleManageTab extends Component {
  constructor(props) {
    super(props)
    this.state = {position: null, writtenPositions: null, exercisePositions:null }
  }

  onCancelClick = (shouldRefresh) => {
    this.setState({burnPosition: null, exercisePosition: null, sellPosition: null, refresh: !!shouldRefresh})
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
    return <div className="simple-manage-tab">
      {!this.context.web3.selectedAccount && <>
        <div className="page-title mb-0">MANAGE YOUR POSITIONS</div>
        <div className="page-subtitle">Connect your account to load your wallet information.</div>
        <div className="action-button-wrapper">
          <div className="home-btn medium solid-green" onClick={this.onConnectClick}>
            <div>CONNECT ACCOUNT</div>
          </div>
        </div>
      </>}
      {this.context.web3.selectedAccount && <> 
        {this.state.writtenPositions && this.state.writtenPositions.length === 0 && 
        this.state.exercisePositions && this.state.exercisePositions.length === 0 && <>
          <div className="page-subtitle">No open positions for {this.props.selectedPair.underlyingSymbol}{this.props.selectedPair.strikeAssetSymbol}</div>
        </>}
        <WrittenOptionsPositions {...this.props} mode={PositionsLayoutMode.Basic} loadedPositions={this.loadedWrittenPositions} onBurnPositionSelect={this.onBurnPositionSelect}></WrittenOptionsPositions>
        {this.state.exercisePositions && this.state.exercisePositions.length > 0 && <div className="page-title">MANAGE LONG OPTIONS POSITIONS</div>}
        <ExercisePositions {...this.props} mode={PositionsLayoutMode.Basic} loadedPositions={this.loadedExercisePositions} setPosition={this.onExercisePositionSelect} setSellPosition={this.onSellPositionSelect} refresh={this.state.refresh} updated={() => this.setState({refresh: false})}></ExercisePositions>  

        {!this.state.writtenPositions &&
        !this.state.exercisePositions && <Loading/>}
        {this.state.burnPosition && <Burn {...this.props} position={this.state.burnPosition} onCancelClick={this.onCancelClick}></Burn>}
        {this.state.exercisePosition && <ExerciseModal {...this.props} position={this.state.exercisePosition} onHide={(shouldRefresh) => this.onCancelClick(shouldRefresh)}></ExerciseModal>}
        {this.state.sellPosition && <SimpleSellModal {...this.props} position={this.state.sellPosition} onHide={(shouldRefresh) => this.onCancelClick(shouldRefresh)}></SimpleSellModal>}
      </>}
    </div>
  }
}

SimpleManageTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(SimpleManageTab)