import './RewardChart.css'
import React, { Component } from 'react'
import { Scatter } from 'react-chartjs-2'

class RewardChart extends Component {
  constructor() {
    super()
    this.chartReference = React.createRef()
    this.state = {
      chart: {datasets: []},
      yAxes: [],
      xAxes: []
    }
  }

  parseToNumber = (strikePrice, decimals = 6) => {
    const precision = 1000000000.0
    return Math.round(100 * parseFloat(strikePrice * BigInt(precision) / BigInt("1".padEnd(decimals + 1, "0"))) / precision) / 100
  }

  getBaseAxe = () => {
    return {
      display: true,
      gridLines: {
        color: '#a6a6a680',
        zeroLineColor: '#a6a6a680',
        borderDash: [5, 5]
      },
      scaleLabel: {
        display: true,
        fontFamily: "Montserrat",
        fontColor: "#a6a6a6",
        lineHeight: 1.15,
        fontSize: 13
      },
      ticks: {
        fontFamily: "Montserrat",
        fontColor: "#a6a6a6",
        lineHeight: 1.1,
        fontSize: 12,
        callback: function(value, index, values) {
          return value.toLocaleString(undefined,{style:'currency',currency:'USD'});
        }
      }
    }
  }

  componentDidMount = () => {
    if (!!this.props.acos) {
      var datasets = [{
        fill: false,
        borderWidth: 3,
        lineTension: 1,
        showLine: true,
        pointRadius: 0,
        hitRadius: 5,
        pointHitRadius: 5,
        hoverRadius: 4,
        hoverBorderWidth: 0,
        data: [],
        borderColor: "#5de9d4",
        backgroundColor: "#5de9d4"
      }]
      var yAxes = []
      var xAxes = []

      var acos = this.props.acos.sort((a,b) => BigInt(a.strikePrice) > BigInt(b.strikePrice) ? 1 : BigInt(a.strikePrice) < BigInt(b.strikePrice) ? -1 : 0)
      if (acos.length > 0) {
        var minStrike = this.parseToNumber(BigInt(acos[0].strikePrice))
        var maxStrike = this.parseToNumber(BigInt(acos[acos.length - 1].strikePrice))
        var maxX = 2.5 * maxStrike

        var offset = 0.05
        for (var k = minStrike; k <= maxX; k = k + offset) {
          var x = Math.round(k * 100) / 100
          var y = 0
          for (var j = 0; j < acos.length; ++j) {
            var strike = this.parseToNumber(BigInt(acos[j].strikePrice))
            if (strike < k) {
              y += (k - strike) * this.parseToNumber(BigInt(acos[j].amount), 18)
            }
          }
          datasets[0].data.push({y: y, x: x})
        }
        
        var xAxe = this.getBaseAxe()
        xAxe.scaleLabel.labelString = "AUC Price"
        xAxe.ticks.max = maxX
        xAxes.push(xAxe)
        var yAxe = this.getBaseAxe()
        yAxe.scaleLabel.labelString = "Profit"
        yAxes.push(yAxe)
      }
      this.setState({chart: {datasets: datasets}, yAxes: yAxes, xAxes: xAxes})
    } else {
      this.setState({chart: {datasets: []}, yAxes: [], xAxes: []})
    }
  }

  render() {
    return (
      <div className="rewards-chart-wrapper">
        <Scatter
          ref={this.chartReference}
          data={this.state.chart}
          legend={{display: false}}
          options={{
            responsive: true,
            stacked: false,
            maintainAspectRatio: false,
            title: { display: false },
            scales: {
              yAxes: this.state.yAxes,
              xAxes: this.state.xAxes
            },
            tooltips: {
              enabled: true,
              bodyFontFamily: 'Montserrat',
              titleFontFamily: 'Montserrat',
              mode: 'x-axis',
              displayColors: false,
              position: 'nearest',
              callbacks: {
                label: function(tooltipItem, data) {
                  return "Profit " + tooltipItem.yLabel.toLocaleString(undefined,{style:'currency',currency:'USD'});
                },
                title: function(tooltipItem, data) {
                  return "AUC Price " + tooltipItem[0].xLabel.toLocaleString(undefined,{style:'currency',currency:'USD'});
                }
              }
            }
          }} />
      </div>)
  }
}
export default RewardChart