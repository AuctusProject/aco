import './CalculatorModal.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import DecimalInput from '../Util/DecimalInput'
import { blackScholesData } from '../../util/blackScholes'
import { getCoingeckoUsdPriceFromAddress } from '../../util/coingeckoApi'
import Loading from '../Util/Loading'
import { usdSymbol } from '../../util/network'

class CalculatorModal extends Component {
  constructor(props) {
    super(props)
    this.state = { assetPrice: "",impliedVolatility: "130", currentPrice: "", loading: true, setIVFocus:false }
    this.ivInput = React.createRef()
  }

  componentDidMount = () => {
    getCoingeckoUsdPriceFromAddress(this.props.calcModal.selectedOption.selectedUnderlying.address).then(assetPrice => {
      var currentPrice = null
      if (assetPrice) {
        currentPrice = assetPrice
      }
      this.setState({currentPrice: currentPrice, assetPrice:currentPrice, loading: false}, () => {
        this.setInputFocus()
        this.setCalculatedOptionPrice()
      })
    })
    .catch(() => this.setState({currentPrice: null, loading: false}))
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.accountToggle !== prevProps.accountToggle) {
      this.props.onHide(false)
    }
  }

  setInputFocus = () => {
    this.setState({setIVFocus:true})
  }

  onConfirm = () => {
    this.props.onHide(this.state.calculatedPrice)
  }

  canConfirm = () => {
    return this.state.calculatedPrice > 0
  }

  onAssetPriceChange = (value) => {
    this.setState({assetPrice: value}, this.setCalculatedOptionPrice)
  }

  onImpliedVolatilityChange = (value) => {
    this.setState({impliedVolatility: value}, this.setCalculatedOptionPrice)
  }

  setCalculatedOptionPrice = () => {
    var option = this.props.calcModal.selectedOption
    var blackScholes = blackScholesData(this.state.assetPrice, option.strikeValue, option.expirationDate, option.selectedType === 1, this.state.impliedVolatility/100.0, 0)
    this.setState({calculatedPrice: blackScholes.price})
  }

  render() {
    return (<Modal className="aco-modal no-header calculator-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Body>
        <div className="exercise-action"> 
          {this.state.loading ? <Loading></Loading> : 
          <div className="confirm-card">
            <div className="confirm-card-header">BLACK SCHOLES PRICING MODEL</div>
            <div className="confirm-card-body">
              <div className="input-row">
                <div className="input-column">
                  <div className="input-label">{this.props.calcModal.selectedOption.selectedUnderlying.symbol} Price</div>
                  <div className="input-field">
                    <DecimalInput notifyOnChange={true} onChange={this.onAssetPriceChange} value={this.state.assetPrice}></DecimalInput>
                  </div>
                  <div className="input-hint">
                    Current: {this.state.currentPrice}
                  </div>
                </div>
              </div>
              <div className="input-row mt-3">
                <div className="input-column">
                  <div className="input-label">IV (%)</div>
                  <div className="input-field">
                    <DecimalInput setFocus={this.state.setIVFocus} onFocus={() => this.setState({setIVFocus: false})} notifyOnChange={true} onChange={this.onImpliedVolatilityChange} value={this.state.impliedVolatility}></DecimalInput>
                  </div>
                </div>
              </div>
              <div className="input-row mt-3">
                <div className="input-column">
                  <div className="input-label">Option Price</div>
                  <div className="calculated-price">
                    {this.state.calculatedPrice ? (this.state.calculatedPrice.toFixed(2) + " " + usdSymbol()): "-"}
                  </div>
                </div>
              </div>
            </div>
            <div className="confirm-card-actions">
              <div className="aco-button cancel-btn" onClick={() => this.props.onHide(false)}>Cancel</div>
              <div className={"aco-button action-btn " + (this.canConfirm() ? "" : "disabled")} onClick={this.onConfirm}>Confirm</div>
            </div>
          </div>}
        </div>
      </Modal.Body>
    </Modal>)
  }
}

CalculatorModal.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(CalculatorModal)
