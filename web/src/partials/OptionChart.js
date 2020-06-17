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
      chart: {},
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

  componentDidMount = () => {
    if (!!this.props.optionPrice && !!this.props.strikePrice && !!this.props.quantity && !!this.props.volatility) {
      var chart = {
        datasets: [{
          fill: false,
          borderColor: '#a8c708',
          borderWidth: 2,
          lineTension: 0.01,
          showLine: true,
          pointRadius: 0,
          hitRadius: 4,
          hoverRadius: 4,
          hoverBorderWidth: 0,
          data: [],
          backgroundColor: '#a8c708'
        }]
      }
      var precision = this.getPrecision(this.props.strikePrice)
      var offset = Math.round(this.props.strikePrice * this.props.volatility / 100 * precision) / precision

      var min
      var max
      if ((this.props.isBuy && this.props.isCall) || (!this.props.isBuy && !this.props.isCall)) {
        min = this.props.strikePrice
        max = this.props.strikePrice + offset
      } else {
        min = Math.max(this.props.strikePrice - offset, 0)
        max = this.props.strikePrice
      }
      var step = Math.round(precision * (max - min) / this.props.points) / precision
      if ((this.props.isBuy && this.props.isCall) || (!this.props.isBuy && !this.props.isCall)) {
        min = min - 2 * step
      } else {
        max = max + 2 * step
      }
      var x = min
      while (x <= max) {
        chart.datasets[0].data.push({x: x, y: this.getProfit(x)})
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
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.optionPrice !== this.props.optionPrice || prevProps.strikePrice !== this.props.strikePrice
      || prevProps.quantity !== this.props.quantity || prevProps.volatility !== this.props.volatility 
      || prevProps.isBuy !== this.props.isBuy || prevProps.isCall !== this.props.isCall) {
      this.componentDidMount()
    }
  }

  getProfit = (price) => {
    var priceDiff = Math.max(this.props.isCall ? (price - this.props.strikePrice) : (this.props.strikePrice - price), 0)
    if (this.props.isBuy) {
      return this.props.quantity * (priceDiff - this.props.optionPrice)
    } else {
      return this.props.quantity * (this.props.optionPrice - priceDiff)
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
          tooltips: {
            displayColors: false,
            bodyFontFamily: 'Roboto',
            bodyFontSize: 12,
            bodyFontColor: '#ffffff',
            callbacks: {
              label: (tooltipItem, data) => {
                const dataset = data.datasets[tooltipItem.datasetIndex]
                let text = "Price: " + dataset.data[tooltipItem.index].x + "  "
                if (dataset.data[tooltipItem.index].y < 0) {
                  text += "Loss: " 
                } else {
                  text += "Profit: " 
                }
                return text + dataset.data[tooltipItem.index].y
              },
              title: () => ''
            }
          },
          scales: {
            xAxes: [this.state.xAxes],
            yAxes: [this.state.yAxes]
          }
        }} />
    </div>)
  }
}
export default OptionChart