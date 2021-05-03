import './WriteStep2.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import OptionBadge from '../OptionBadge'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { getOptionFormattedPrice } from '../../util/acoTokenMethods'
import { formatDate } from '../../util/constants'
import { getAvailableOptionsByPair } from '../../util/dataController'

class WriteStep2 extends Component {
  constructor() {
    super()
    this.state = {options: null}
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair || 
      this.props.optionType !== prevProps.optionType) {
      this.componentDidMount()
    }
  }

  componentDidMount = () => {
    getAvailableOptionsByPair(this.props.selectedPair, this.props.optionType).then(options => {
      this.setState({options: options})
    })
  }

  onOptionRowClick = (option) => () => {
    this.props.setOption(option)
  }

  render() {
    return <div className="write-step2">
        <div className="page-subtitle">Select which option series you would like to write</div>
        <table className="aco-table mx-auto">
          <thead>
            <tr>
              <th>TYPE</th>
              <th>SYMBOL</th>
              <th>EXPIRY</th>
              <th>STRIKE PRICE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(!this.state.options || this.state.options.length === 0) && 
              <tr>
                {!this.state.options && <td colSpan="5">Loading...</td>}
                {this.state.options && this.state.options.length === 0 && <td colSpan="5">No options available for {this.props.selectedPair.underlyingSymbol}{this.props.selectedPair.strikeAssetSymbol}</td>}
              </tr>
            }
            {this.state.options && this.state.options.map(option => 
            <tr className="clickable" key={option.acoToken} onClick={this.onOptionRowClick(option)}>
              <td><OptionBadge isCall={option.isCall}></OptionBadge></td>
              <td>{option.acoTokenInfo.symbol}</td>
              <td>{formatDate(option.expiryTime)}</td>
              <td>{getOptionFormattedPrice(option)}</td>
              <td><FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon></td>
            </tr>)}
          </tbody>
        </table>
      </div>
  }
}

WriteStep2.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(WriteStep2)