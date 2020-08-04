import './OptionChart.css'
import React, { Component } from 'react'
import { Scatter } from 'react-chartjs-2'

const axesProprerties = JSON.stringify({
  display: true,
  gridLines: {
    color: 'rgba(255, 255, 255, 0.1)',
    zeroLineColor: 'rgba(255, 255, 255, 0.25)'
  },
  scaleLabel: {
    display: true,
    fontFamily: "Roboto",
    fontColor: "#a6a6a6",
    lineHeight: 1.15,
    fontSize: 12
  },
  ticks: {
    fontFamily: "Roboto",
    fontColor: "#a6a6a6",
    lineHeight: 1.1,
    fontSize: 11
  }
})

class OptionChart extends Component {
  constructor() {
    super()
    this.state = {
      chart: this.getBaseChart(),
      xAxes: {},
      yAxes: {}
    }
  }
  static defaultProps = {
    quantity: 1,
    volatility: 20,
    points: 8,
    isBuy: true,
    isCall: true       
  }

  getBaseChart = () => {
    return {
      datasets: [{
        fill: false,
        borderColor: '#a8c708',
        borderWidth: 2,
        lineTension: 0.01,
        showLine: true,
        pointRadius: 0,
        hitRadius: 0,
        hoverRadius: 0,
        hoverBorderWidth: 0,
        data: [],
        backgroundColor: '#a8c708'
      }]
    }
  }

  componentDidMount = () => {
    if (!!this.props.optionPrice && !isNaN(this.props.optionPrice) && !!this.props.strikePrice && !isNaN(this.props.strikePrice) 
    && !!this.props.quantity && !isNaN(this.props.quantity) && !!this.props.volatility && !isNaN(this.props.volatility) 
    && !!this.props.currentPrice && !isNaN(this.props.currentPrice)) {
      var chart = this.getBaseChart()
      var precision = this.getPrecision(this.props.strikePrice)
      var offset = Math.round(this.props.strikePrice * this.props.volatility / 100 * precision) / precision

      var min
      var max
      if (this.props.isBuy && this.props.isCall) {
        min = Math.min(this.props.strikePrice, this.props.currentPrice)
        max = Math.max(this.props.strikePrice, this.props.currentPrice) + offset
      } else {
        min = Math.max(Math.min(this.props.strikePrice, this.props.currentPrice) - offset, 0)
        max = Math.max(this.props.strikePrice, this.props.currentPrice)
      }
      var step = Math.round(precision * (max - min) / this.props.points) / precision
      var extraPoints = Math.ceil(this.props.points / 3);
      if (this.props.isCall && this.props.isBuy) {
        min = min - extraPoints * step
      } else {
        max = max + extraPoints * step
      }
      var x = min
      var inflectionPoint = false
      while (x <= max) {
        chart.datasets[0].data.push({x: x, y: this.getProfit(x)})
        if (!inflectionPoint && x + step > this.props.strikePrice) {
          chart.datasets[0].data.push({x: this.props.strikePrice, y: this.getProfit(this.props.strikePrice)})
          inflectionPoint = true
        }
        x += step
        if (x < max && x + step > max) x = max
      }
      const xAxes = JSON.parse(axesProprerties)
      xAxes.scaleLabel.labelString = "Price"
      xAxes.gridLines.borderDash = [step/2, step/2]
      const yAxes = JSON.parse(axesProprerties)
      yAxes.scaleLabel.labelString = "Profit / Loss"
      yAxes.gridLines.borderDash = [step/2, step/2]
      this.setState({chart: chart, xAxes: xAxes, yAxes: yAxes})
    }
    else {
      this.setState({chart: this.getBaseChart(), xAxes: {}, yAxes: {}})
    }
  }

  componentDidUpdate = (prevProps) => {
    if ((!!this.props.optionPrice && !isNaN(this.props.optionPrice) && prevProps.optionPrice !== this.props.optionPrice) || 
        (!!this.props.strikePrice && !isNaN(this.props.strikePrice) && prevProps.strikePrice !== this.props.strikePrice) ||
        (!!this.props.quantity && !isNaN(this.props.quantity) && prevProps.quantity !== this.props.quantity) ||
        (!!this.props.volatility && !isNaN(this.props.volatility) && prevProps.volatility !== this.props.volatility) ||
        (!!this.props.currentPrice && !isNaN(this.props.currentPrice) && prevProps.currentPrice !== this.props.currentPrice) ||
        prevProps.isBuy !== this.props.isBuy || prevProps.isCall !== this.props.isCall) {
        this.componentDidMount()
    }
  }

  getProfit = (price) => {
    if (this.props.isBuy || !this.props.isCall) {
      var profit = Math.max(this.props.isCall ? (price - this.props.strikePrice) : (this.props.strikePrice - price), 0)
      if (this.props.isBuy) {
        return this.props.quantity * (profit - this.props.optionPrice)
      } else {
        return this.props.quantity * (this.props.optionPrice - profit)
      }
    } else {
      return this.props.quantity * (this.props.optionPrice + Math.min(price, this.props.strikePrice) - this.props.currentPrice)
    }
  }

  getPrecision = (baseValue) => {
    if (baseValue <= 0.001) {
      return 1000000
    } else if (baseValue <= 0.01) {
      return 100000
    } else if (baseValue <= 0.1) {
      return 10000
    } else if (baseValue <= 1) {
      return 1000
    } else if (baseValue <= 10) {
      return 100
    } else if (baseValue <= 100) {
      return 10
    } else {
      return 1
    }
  }

  render() {
    return (
    <div className="chart-wrapper">
      <Scatter
        data={this.state.chart}
        legend={{display: false}}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            xAxes: [this.state.xAxes],
            yAxes: [this.state.yAxes]
          },
          tooltips: {
            enabled: false
          }
        }} />
    </div>)
  }
}
export default OptionChart