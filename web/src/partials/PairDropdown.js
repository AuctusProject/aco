import './PairDropdown.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import PairInfo from './PairInfo'
import { getPairIdFromRoute } from '../util/constants'
import { baseSymbol, usdSymbol } from '../util/network'

class PairDropdown extends Component {  
  componentDidMount = () => {
    if (this.props.pairs && this.props.pairs.length > 0 && (!this.props.selectedPair || !this.hasSelectedPair())) {
      this.selectInitialPair()
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle) {
      this.props.onPairSelected(null)
    }
    if (this.props.networkToggle !== prevProps.networkToggle || prevProps.pairs !== this.props.pairs) {
      this.componentDidMount()
    }
  }

  hasSelectedPair = () => {
    var pairs = this.props.pairs
    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i].id === this.props.selectedPair.id) {
        return true
      }
    }
    return false
  }

  selectInitialPair = () => {
    var pairs = this.props.pairs
    var pairId = getPairIdFromRoute(this.props.location)
    if (pairId) {
      for (let i = 0; i < pairs.length; i++) {
        if (pairs[i].id === pairId) {
          this.selectPair(pairs[i])
          return;
        }
      }
      this.selectPair(pairs[0])
    }
    else {
      let basePair = baseSymbol()+"_"+usdSymbol()
      var defaultIndex = this.props.pairs.findIndex((el) => el.id === basePair)
      if (defaultIndex === -1)
        defaultIndex = 0
      this.selectPair(pairs[defaultIndex])
    }
  }

  selectPair = (pair) => {
    this.props.onPairSelected(pair)
  }

  render() {
    return (
      <li className="nav-item dropdown pair-dropdown">                  
        {!this.props.pairs && <div><FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>&nbsp;Loading pairs...</div>}
        {this.props.pairs && <div className={"nav-link " + ((this.props.pairs && this.props.pairs.length > 1) ? "dropdown-toggle clickable" : "")} target="_self" id="navbarPair" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <div className="pair-nav-container">
            {this.props.selectedPair && <PairInfo pair={this.props.selectedPair}></PairInfo>}
          </div>
        </div>}
        {this.props.pairs && this.props.pairs.length > 1 &&
          <div className="dropdown-menu" aria-labelledby="navbarPair">
            {this.props.pairs.map(pair => 
              <div key={pair.id} onClick={() => this.selectPair(pair)} className="dropdown-item clickable" target="_self">
                <PairInfo pair={pair}></PairInfo>
              </div>
            )}
          </div>}
      </li>)
  }
}
PairDropdown.contextTypes = {
  ticker: PropTypes.object
}
export default PairDropdown