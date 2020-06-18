import './SimpleBuyTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import DecimalInput from '../Util/DecimalInput'
import OptionBadge from '../OptionBadge'
import SimpleDropdown from '../SimpleDropdown'
import { formatDate, groupBy } from '../../util/constants'
import { getOptionFormattedPrice } from '../../util/acoTokenMethods'

class SimpleBuyTab extends Component {
  constructor(props) {
    super(props)
    this.state = { selectedType: 1 }
  }

  componentDidMount = () => {
    
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedPair !== prevProps.selectedPair) {
      this.selectType(this.state.selectedType)
    }
  }

  onQtyChange = (value) => {
    this.setState({ qtyValue: value})
  }

  selectType = (type) => {
    var strikeOptions = this.filterStrikeOptions(type)
    this.setState({ selectedType: type, strikeOptions: strikeOptions})
  }

  onStrikeChange = (strikeOption) => {
    var expirationOptions = this.filterExpirationOptions(strikeOption, this.state.selectedType)
    this.setState({selectedStrike: strikeOption, expirationOptions: expirationOptions})    
  }

  filterExpirationOptions = (strikeOption, type) => {
    var filteredOptions = this.props.options.filter(o => o.strikePrice === strikeOption.value && o.isCall === (type === 1))
    var grouppedOptions = groupBy(filteredOptions, "expiryTime")
    var hasCurrentSelectedExpiration = false
    var expirationOptions = Object.keys(grouppedOptions).map((expiryTime) => {
      if (this.state.selectedExpiration && this.state.selectedExpiration.value === expiryTime) {
        hasCurrentSelectedExpiration = true
      }
      return { value: expiryTime, name: formatDate(expiryTime, true)}
    })
    if (!hasCurrentSelectedExpiration) {
      this.setState({selectedExpiration: null})
    }
    return expirationOptions
  }

  filterStrikeOptions = (type) => {
    var filteredOptions = this.props.options ? this.props.options.filter(o => o.isCall === (type === 1)) : []
    var grouppedOptions = groupBy(filteredOptions, "strikePrice")
    var hasCurrentSelectedStrike = false
    var strikeOptions = Object.keys(grouppedOptions).map((strikePrice) => {
      if (this.state.selectedStrike && this.state.selectedStrike.value === strikePrice) {
        hasCurrentSelectedStrike = true
      }
      return { value: strikePrice, name: getOptionFormattedPrice(grouppedOptions[strikePrice][0])}
    })
    if (!hasCurrentSelectedStrike) {
      this.setState({selectedStrike: null, selectedExpiration: null})
    }
    return strikeOptions
  }

  onExpirationChange = (expirationOption) => {
    this.setState({selectedExpiration: expirationOption})
  }

  onBuyClick = () => {

  }

  onConnectClick = () => {
    this.props.signIn(null, this.context)
  }

  render() {
    return <div className="simple-buy-tab">
      <div className="inputs-wrapper">
        <div className="input-column">
          <div className="input-label">Qty</div>
          <div className="input-field">
            <DecimalInput tabIndex="-1" placeholder="Option amount" onChange={this.onQtyChange} value={this.state.qtyValue}></DecimalInput>
          </div>
        </div>
        <div className="input-column">
          <div className="input-label">Type</div>
          <div className="input-field type-toggle">
            <OptionBadge onClick={() => this.selectType(1)} className={this.state.selectedType === 1 ? "active" : "unselected"} isCall={true}/>
            <OptionBadge onClick={() => this.selectType(2)} className={this.state.selectedType === 2 ? "active" : "unselected"} isCall={false}/>
          </div>
        </div>
        <div className="input-column">
          <div className="input-label">Strike</div>
          <div className="input-field">
            <SimpleDropdown placeholder="Select strike" selectedOption={this.state.selectedStrike} options={this.state.strikeOptions} onSelectOption={this.onStrikeChange}></SimpleDropdown>
          </div>
        </div>
        <div className="input-column">
          <div className="input-label">Expiration</div>
          <div className="input-field">
            {this.state.selectedStrike ? 
            <SimpleDropdown placeholder="Select expiration" selectedOption={this.state.selectedExpiration} options={this.state.expirationOptions} onSelectOption={this.onExpirationChange}></SimpleDropdown>:
              <span className="simple-dropdown-placeholder">Select strike first</span>
            }
          </div>
        </div>
      </div>
      <div className="action-button-wrapper">
        {this.props.isConnected ? <div className="home-btn medium solid-green" onClick={this.onBuyClick}>
          <div>BUY</div>
        </div> :
        <div className="home-btn medium solid-green" onClick={this.onConnectClick}>
          <div>CONNECT ACCOUNT</div>
        </div>}
      </div>
    </div>
  }
}

SimpleBuyTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(SimpleBuyTab)