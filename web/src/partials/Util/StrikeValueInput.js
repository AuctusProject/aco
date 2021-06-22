import './StrikeValueInput.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getDeribitOptions } from '../../util/acoApi'
import Modal from 'react-bootstrap/Modal'
import ReactTooltip from 'react-tooltip'
import { groupBy } from '../../util/constants'
import { usdSymbol } from '../../util/network'

class StrikeValueInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedStrike: null,
      showModal: false,
      filter: "",
      strikeValues: [],
      filteredStrikes: []
    }
  }

  componentDidMount = () => {
    if (!this.props.disabled) {
      this.getStrikeOptions()
    }
    this.setState({selectedStrike: this.props.selectedStrike})
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.selectedUnderlying !== prevProps.selectedUnderlying || this.props.selectedType !== prevProps.selectedType) {
      this.getStrikeOptions()
    }
  }

  getStrikeOptions = () => {
    if (this.props.selectedUnderlying !== null) {
      getDeribitOptions(this.props.selectedUnderlying.value, this.props.selectedType === 1, null).then(result => {
        var grouppedOptions = groupBy(result, "strikePrice")
        var strikePrices = this.filterStrikePricesRange(Object.keys(grouppedOptions))
        var hasCurrentSelectedStrikePrice = false
        var strikeOptions = strikePrices.map((strikePrice) => {
          if (this.props.selectedStrike && this.props.selectedStrike.value === Number(strikePrice)) {
            hasCurrentSelectedStrikePrice = true
          }
          return { value: Number(strikePrice), name: strikePrice + " " + usdSymbol()}
        })
        this.setState({selectedStrike: !hasCurrentSelectedStrikePrice ? null : this.props.selectedStrike, strikeValues: strikeOptions, filteredStrikes: strikeOptions})
      })
    }
    else  {
      this.setState({selectedStrike: null, strikeOptions: null})
    }
  }

  filterStrikePricesRange = (strikePrices) => {
    var underlyingPrice = this.context.ticker && this.context.ticker[this.props.selectedUnderlying.value]
    var filtered = strikePrices.filter(s => 
      (this.props.selectedType === 1 ? (Number(s) > (underlyingPrice * 0.8) && Number(s) < (underlyingPrice * 3)) :
        (Number(s) < (underlyingPrice * 1.2))
    ))
    return filtered.sort((a,b) => {
      return this.props.selectedType === 1 ? a-b : b-a
    })
  }


  filterStrikes = (strikeValues) => {
    var filter = this.state.filter ? this.state.filter.toString().toLowerCase() : ""
    var filteredStrikes = strikeValues.filter(s => 
      (this.isNullOrEmpty(filter) || 
      s.name.toLowerCase().includes(filter))
    )

    this.setState({strikeValues:strikeValues, filteredStrikes: filteredStrikes})
  }

  isNullOrEmpty = (value) => {
    return value === null || value === ""
  }

  onHideModal = () => {
    this.setState({showModal:false, filter: ""})
  }

  onShowModal = () => {
    if (!this.props.disabled) {
      this.setState({showModal:true})
    }
  }

  onFilterChange = (e) => {
    this.setState({filter: e.target.value}, () => {
      this.filterStrikes(this.state.strikeValues)
    })
  }

  onStrikeSelect = (asset) => () => {
    this.setState({selectedStrike: asset, showModal:false})
    this.props.onStrikeSelected(asset)
  }

  render() {
    return (
      <div className={"asset-input " + (!this.props.disabled ? "clickable" : "")}>
        <div className="" onClick={this.onShowModal}>
          {this.state.selectedStrike ? 
            <div className="selected-asset nowrap">
              {this.state.selectedStrike.name}
            </div> : 
            <div>Select strike</div>
          }
        </div>
        <Modal className="asset-input-modal aco-modal" centered={true} size="sm" show={this.state.showModal} onHide={this.onHideModal}>
          <Modal.Header closeButton>
            Select a strike price
            <ReactTooltip className="asset-input-tooltip" id="asset-input-tooltip">
              Filter strikes searching the field below.
            </ReactTooltip>
          </Modal.Header>
          <Modal.Body>
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  <div className="search-input-wrapper">
                    <input onChange={this.onFilterChange} value={this.state.filter} placeholder="Search value"></input>
                    <FontAwesomeIcon icon={faSearch}/>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="token-name-title">Strike Value</div>
                </div>
              </div>
              <div className="overflow-auto">
                {this.state.filteredStrikes.map(asset => (
                  <div key={asset.value} className="col-md-12 asset-option" onClick={this.onStrikeSelect(asset)}>
                    {asset.name}
                  </div>
                ))}
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    )
  }
}
StrikeValueInput.contextTypes = {
  ticker: PropTypes.object
}
export default withRouter(StrikeValueInput)