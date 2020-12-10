import './OtcTradeTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import OtcTradeTabStep2 from './OtcTradeTabStep2'
import OtcTradeTabStep1 from './OtcTradeTabStep1'
import { getOtcOrder } from '../../util/acoApi'
import OtcTradeTabStep3 from './OtcTradeTabStep3'

class OtcTradeTab extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      otcOrder: null,
      selectedOption: null,
      step: 1
    }
  }

  componentDidMount = () => {
    if (this.props.match.params.orderId) {
      this.loadOtcOrder()
    }
  }
  
  componentDidUpdate = (prevProps) => {    
    if (!this.props.match.params.orderId && this.state.otcOrder) {
      this.setState({otcOrder: null, selectedOption: null, step: 1})
    }
    else if (this.props.match.params.orderId && this.props.match.params.orderId !== prevProps.match.params.orderId) {
      this.loadOtcOrder()
    }
  }

  loadOtcOrder = () => {
    if (!this.state.otcOrder || this.props.match.params.orderId !== this.state.otcOrder.orderId){
      this.setState({step: 3})
      getOtcOrder(this.props.match.params.orderId).then(result => {
        this.setState({otcOrder: result})
      })
    }
  }

  setStep = (value, otcOrder) => {
    this.setState({step: value, otcOrder: otcOrder})
  }

  setSelectedOption = (selectedOption) => {
    this.setState({selectedOption: selectedOption})
  }

  startNewTrade = () => {
    this.props.history.push('/otc/trade')
    this.setState({otcOrder: null, selectedOption: null, step: 1})
  }

  render() {
    return <div className="otc-trade-tab">
      {this.state.step === 1 && <OtcTradeTabStep1 {...this.props} selectedOption={this.state.selectedOption} setSelectedOption={this.setSelectedOption} setStep={this.setStep}></OtcTradeTabStep1>}
      {this.state.step === 2 && <OtcTradeTabStep2 {...this.props} selectedOption={this.state.selectedOption} setStep={this.setStep}></OtcTradeTabStep2>}
      {this.state.step === 3 && <OtcTradeTabStep3 {...this.props} otcOrder={this.state.otcOrder} startNewTrade={this.startNewTrade}></OtcTradeTabStep3>}
    </div>
  }
}

OtcTradeTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(OtcTradeTab)