import './OptionChart.css'
import React, { Component } from 'react'
import { Scatter } from 'react-chartjs-2'

const axesProprerties = JSON.stringify({
  display: true,
  gridLines: {
    color: '#a6a6a680',
    zeroLineColor: '#a6a6a680'
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
    this.chartReference = React.createRef()
    this.state = {
      chart: this.getBaseChart(),
      xAxes: {},
      yAxes: {}
    }
  }
  static defaultProps = {
    quantity: 1,
    volatility: 20,
    isBuy: true,
    isCall: true       
  }

  getBaseChart = () => {
    return {
      datasets: [{
        fill: false,
        borderColor: '#1782fc',
        borderWidth: 2,
        lineTension: 0.01,
        showLine: true,
        pointRadius: 0,
        hitRadius: 5,
        pointHitRadius: 5,
        hoverRadius: 4,
        hoverBorderWidth: 0,
        data: [],
        backgroundColor: '#1782fc'
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
      var step = Math.round(precision * (max - min) / 8) / precision
      if (this.props.isCall && this.props.isBuy) {
        min = min - 2.6 * step
      } else {
        max = max + 2.6 * step
      }
      var x = min
      var internalStep = Math.min(1, (step/3))
      var inflectionPoint = false
      while (x <= max) {
        chart.datasets[0].data.push({x: x, y: this.getProfit(x)})
        if (!inflectionPoint && x + internalStep > this.props.strikePrice) {
          chart.datasets[0].data.push({x: this.props.strikePrice, y: this.getProfit(this.props.strikePrice)})
          inflectionPoint = true
        }
        x += internalStep
        if (x < max && x + internalStep > max) x = max
      }
      chart.datasets[0].data.sort((a,b) => a.x > b.x ? 1 : -1)
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
    if (prevProps.optionPrice !== this.props.optionPrice || 
        prevProps.strikePrice !== this.props.strikePrice ||
        prevProps.quantity !== this.props.quantity ||
        prevProps.volatility !== this.props.volatility ||
        prevProps.currentPrice !== this.props.currentPrice ||
        prevProps.isBuy !== this.props.isBuy || 
        prevProps.isCall !== this.props.isCall) {
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
        ref={this.chartReference}
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
            enabled: false,
						mode: 'index',
						position: 'nearest',
            custom: (tooltip) => {
			        let tooltipEl = document.getElementById('option-chartjs-tooltip');
              if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.id = 'option-chartjs-tooltip';
                this.chartReference.current.chartInstance.canvas.parentNode.appendChild(tooltipEl);
              }

              if (tooltip.opacity === 0) {
                tooltipEl.style.opacity = 0;
                return;
              }

              tooltipEl.classList.remove('above', 'below', 'no-transform');
              if (tooltip.yAlign) {
                tooltipEl.classList.add(tooltip.yAlign);
              } else {
                tooltipEl.classList.add('no-transform');
              }

              const tableWidth = 82;
              if (tooltip.body) {
                let data = tooltip.body[0].lines[0].split(',');
                const x = Math.round(parseFloat(data[0].substring(1)) * 100) / 100;
                const y = Math.round(parseFloat(data[1].substring(0, data[1].length - 1)) * 100) / 100;
                tooltipEl.innerHTML = "<table style='width:" + tableWidth + "px;'><tr style='line-height:1.2;'><td style='float:right;'>P/L:</td><td style='padding-left: 5px;'>" + y + "</td></tr><tr style='line-height:1.2;'><td style='float:right;'>Price:</td><td style='padding-left: 5px;'>" + x + "</td></tr></table>";
              }

              const maxWidth = this.chartReference.current.chartInstance.canvas.parentNode.clientWidth;
              let left = this.chartReference.current.chartInstance.canvas.offsetLeft + tooltip.caretX;
              if (left + tableWidth + 4 > maxWidth) {
                left = left - tableWidth - 2;
              }
              tooltipEl.style.opacity = 1;
              tooltipEl.style.position = 'absolute';
              tooltipEl.style.left = left + 'px';
              tooltipEl.style.top = this.chartReference.current.chartInstance.canvas.offsetTop + tooltip.caretY + 'px';
              tooltipEl.style.fontFamily = 'Roboto';
              tooltipEl.style.fontSize = '11px';
              tooltipEl.style.padding ='2px 2px';
              tooltipEl.style.borderRadius = '4px';
            }
          }
        }} />
    </div>)
  }
}
export default OptionChart