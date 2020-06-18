import './Simple.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { getPairsFromOptions, getOptionsFromPair } from '../util/acoFactoryMethods'
import { getTokensList } from '../util/acoApi'
import PairDropdown from '../partials/PairDropdown'
import SimpleBuyTab from '../partials/Simple/SimpleBuyTab'
import SimpleWriteTab from '../partials/Simple/SimpleWriteTab'
import SimpleManageTab from '../partials/Simple/SimpleManageTab'

class Simple extends Component {
  constructor() {
    super()
    this.state = { pairs: null }
  }
  
  componentDidMount = () => {
    this.loadAvailableOptions()
  }

  isConnected = () => {
    return this.context && this.context.web3 && this.context.web3.selectedAccount && this.context.web3.validNetwork
  }  

  loadAvailableOptions = () => {
    getTokensList().then(result => {
      var pairs = getPairsFromOptions(result)
      this.setState({options: result, pairs: pairs})
    })
  }

  setPosition = (position) => {
    this.setState({position: position})
  }

  onCancelClick = () => {
    this.setPosition(null)
  }
  
  getOptionsFromPair = () => {
    return getOptionsFromPair(this.state.options, this.props.selectedPair)
  }

  render() {
    var filteredOptions = this.getOptionsFromPair()
    return <div className="py-4">
        <ul className="pair-dropdown-wrapper"><PairDropdown {...this.props} pairs={this.state.pairs}></PairDropdown></ul>
        <div className="simple-box">
          <ul className="nav nav-tabs justify-content-center" id="simpleTabs" role="tablist">
            <li className="nav-item">
              <a className="nav-link active" id="buy-tab" data-toggle="tab" href="#buy" role="tab" aria-controls="buy" aria-selected="true">Buy</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" id="write-tab" data-toggle="tab" href="#write" role="tab" aria-controls="write" aria-selected="false">Write</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" id="manage-tab" data-toggle="tab" href="#manage" role="tab" aria-controls="manage" aria-selected="false">Manage</a>
            </li>
          </ul>
          <div className="tab-content" id="simpleTabsContent">
            <div className="tab-pane fade show active" id="buy" role="tabpanel" aria-labelledby="buy-tab">
              <SimpleBuyTab {...this.props} isConnected={this.isConnected()} options={filteredOptions}/>
            </div>
            <div className="tab-pane fade" id="write" role="tabpanel" aria-labelledby="write-tab">
              <SimpleWriteTab {...this.props} isConnected={this.isConnected()} options={filteredOptions}/>
            </div>
            <div className="tab-pane fade" id="manage" role="tabpanel" aria-labelledby="manage-tab">
              <SimpleManageTab {...this.props} isConnected={this.isConnected()} options={filteredOptions}/>
            </div>
          </div>
        </div>
      </div>
  }
}

Simple.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(Simple)