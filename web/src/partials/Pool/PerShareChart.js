import './PerShareChart.css'
import React, { Component } from 'react'
import { Chart, Line } from 'react-chartjs-2'
import { getAcoPoolHistory } from '../../util/acoApi'
import { fromDecimals } from '../../util/constants'
  
class PerShareChart extends Component { 
  constructor() {
    super()
    this.chartReference = React.createRef()
    this.state = {
      chart: this.getBaseChart(),
      xAxes: {display: false},
      yAxes: {display: false}
    }
  }

  getBaseChart = () => {
    return {
      labels: [],
      datasets: [{
        fill: true,
        borderColor: '#1782fc',
        backgroundColor: "rgba(23,130,252,0.2)",
        borderWidth: 4,
        lineTension: 0.2,
        showLine: true,
        pointRadius: 0,
        data: []
      }]
    }
  }

  componentDidMount = () => {
    if (!!this.props.pool) {
      getAcoPoolHistory(this.props.pool).then((data) => this.setState({data: data}, () => this.setChart())).catch((err) => {
        console.error(err)
        this.setState({chart: this.getBaseChart()}, () => this.props.setLastPerShare(null))
      })
    } else {
      this.setState({chart: this.getBaseChart()}, () => this.props.setLastPerShare(null))
    }
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.pool !== this.props.pool) {
      this.componentDidMount()
    } else if (prevProps.isUnderlyingValue !== this.props.isUnderlyingValue) {
      this.setChart()
    }
  }

  setChart() {
    let chart = this.getBaseChart()
    const lang = (navigator.language || navigator.languages[0] || 'en')
    const dataFormat = new Intl.DateTimeFormat(lang,{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'})
    const decimals = parseInt(this.props.isUnderlyingValue ? this.props.underlyingInfo.decimals : this.props.strikeAssetInfo.decimals)
    const underlyingPrecision = BigInt(10 ** parseInt(this.props.underlyingInfo.decimals))
    for (let i = 0; i < this.state.data.length; ++i) {
      chart.labels.push(dataFormat.format(new Date(this.state.data[i].t * 1000)))
      let value
      if (this.props.isUnderlyingValue) {
        value = BigInt(this.state.data[i].u) + (BigInt(this.state.data[i].s) * underlyingPrecision / BigInt(this.state.data[i].p))
      } else {
        value = BigInt(this.state.data[i].s) + (BigInt(this.state.data[i].u) * BigInt(this.state.data[i].p) / underlyingPrecision)
      }
      chart.datasets[0].data.push(parseFloat(fromDecimals(value.toString(10), decimals)))
    }
    this.setState({chart: chart}, () => {
      if (this.state.chart.datasets[0].data.length > 0) {
        this.props.setLastPerShare(this.state.chart.datasets[0].data[this.state.chart.datasets[0].data.length - 1])
      } else {
        this.props.setLastPerShare(null)
      }
    })
    Chart.pluginService.register({
      afterDraw: function(chart, easing) {
        if (chart.tooltip._active && chart.tooltip._active.length) {
          const activePoint = chart.controller.tooltip._active[0];
          const ctx = chart.ctx;
          const x = activePoint.tooltipPosition().x;
          const topY = chart.scales['y-axis-0'].top;
          const bottomY = chart.scales['y-axis-0'].bottom;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.lineTo(x, bottomY);
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#a6a6a6';
          ctx.stroke();
          ctx.restore();
        }
      }
    })
  }

  render() {
    return (
    <div className="chart-wrapper">
      <Line
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
            enabled: true,
            bodyFontFamily: 'Roboto',
            titleFontFamily: 'Roboto',
						mode: 'x-axis',
            displayColors: false,
						position: 'nearest',
            callbacks: {
              label: function(tooltipItem, data) {
                var numberFormat = new Intl.NumberFormat((navigator.language || navigator.languages[0] || 'en'));
                return numberFormat.format(tooltipItem.yLabel);
              }
            }
          }
        }} />
    </div>)
  } 
}
export default PerShareChart