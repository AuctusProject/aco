import './RewardChart.css'
import React, { Component } from 'react'
import { Scatter } from 'react-chartjs-2'
import { parseBigIntToNumber } from '../../util/constants'

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

  componentDidMount = () => {
    this.loadChart()
  }

  componentDidUpdate = (prevProps) => { 
    if (this.props.airdropCurrentOption !== prevProps.airdropCurrentOption ||
      this.props.airdropUnclaimed !== prevProps.airdropUnclaimed || 
      this.props.acoBalances !== prevProps.acoBalances || 
      this.props.rewardUnclaimed !== prevProps.rewardUnclaimed) {
      this.loadChart()
    }   
  }

  getAcoList = () => {
    var acos = []
    if (this.props.airdropCurrentOption && this.props.airdropUnclaimed && this.props.acoBalances && this.props.rewardUnclaimed) {
      let result = {}
      if (this.props.airdropUnclaimed.amount) {
        result[this.props.airdropCurrentOption.aco] = {strikePrice: BigInt(this.props.airdropCurrentOption.strikePrice), amount: BigInt(this.props.airdropUnclaimed.amount)}
      }
      this.parseAcoList(result, this.props.acoBalances)
      this.parseAcoList(result, this.props.rewardUnclaimed)
      acos = Object.values(result).sort((a,b) => a.strikePrice > b.strikePrice ? 1 : a.strikePrice < b.strikePrice ? -1 : 0)
    }
    return acos
  }

  parseAcoList = (result, list) => {
    for (let i = 0; i < list.length; ++i) {
      if (!result[list[i].aco]) {
        result[list[i].aco] = {strikePrice: BigInt(list[i].strikePrice), amount: BigInt(list[i].amount)}
      } else {
        result[list[i].aco].amount += BigInt(list[i].amount)
      }
    }
  }

  getBaseAxe = () => {
    return {
      display: true,
      gridLines: {
        color: '#a6a6a6',
        zeroLineColor: '#a6a6a6',
        borderDash: [10, 10]
      },
      scaleLabel: {
        display: true,
        fontFamily: "Montserrat",
        fontColor: "#ffffff",
        lineHeight: 1.2,
        fontSize: 14
      },
      ticks: {
        fontFamily: "Montserrat",
        fontColor: "#ffffff",
        lineHeight: 1.1,
        fontSize: 12,
        callback: function(value, index, values) {
          return value.toLocaleString(undefined,{style:'currency',currency:'USD'});
        }
      }
    }
  }

  loadChart = () => {
    var acos = this.getAcoList()
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

    if (acos.length > 0) {
      var minStrike = parseBigIntToNumber(acos[0].strikePrice)
      var maxStrike = parseBigIntToNumber(acos[acos.length - 1].strikePrice)
      var maxX = 5

      var offset = 0.05
      for (var k = minStrike; k <= maxX; k = k + offset) {
        var x = Math.round(k * 100) / 100
        var y = 0
        for (var j = 0; j < acos.length; ++j) {
          var strike = parseBigIntToNumber(acos[j].strikePrice)
          if (strike < k) {
            y += (k - strike) * parseBigIntToNumber(acos[j].amount, 18)
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
  }

  render() {
    return (
      <div>
        {this.state.chart && this.state.chart.datasets.length > 0 && this.state.chart.datasets[0].data.length > 0 &&
          <div className="rewards-chart-container">
            <div className="rewards-chart-title">View your potential Profit</div>
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
            </div>
          </div>
        }
      </div>
      )
  }
}
export default RewardChart