import './PerShareChart.css'
import React, { Component } from 'react'
import { Chart, Line } from 'react-chartjs-2'
import { fromDecimals } from '../../util/constants'
import { getPoolHistoricalShares } from '../../util/dataController'

const axesProperties = JSON.stringify({
  display: true,
  gridLines: {
    display:false
  },
  scaleLabel: {
    display: true,
    fontFamily: "Montserrat",
    fontColor: "#a6a6a6",
    lineHeight: 1.15,
    fontSize: 10
  },
  ticks: {
    autoSkip: true,
    maxTicksLimit: 8,
    maxRotation: 0,
    minRotation: 0,
    fontFamily: "Montserrat",
    fontColor: "#a6a6a6",
    lineHeight: 1.1,
    fontSize: 10
  }
})

const chartPlugin = {
  id: "pershare-chart",
  afterDraw: function(chart, easing) {
    if (chart.tooltip._active && chart.tooltip._active.length && chart.scales['y-axis-0']) {
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
}

class PerShareChart extends Component { 
  constructor() {
    super()
    this.chartReference = React.createRef()
    const xAxe = JSON.parse(axesProperties)
    xAxe.type = 'time'
    xAxe.distribution = 'series'
    xAxe.time = { unit: 'day' }
    const yAxe = JSON.parse(axesProperties)
    yAxe.ticks.maxTicksLimit = 4
    this.state = {
      data: [],
      chart: this.getBaseChart(),
      xAxes: xAxe,
      yAxes: yAxe
    }
  }

  getBaseChart = () => {
    return {
      datasets: [{
        fill: true,
        borderColor: '#5de9d4',
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
      getPoolHistoricalShares(this.props.pool).then((data) => this.setState({data: data}, () => {
        this.setChart()
      })).catch((err) => {
        console.error(err)
        this.setState({chart: this.getBaseChart(), data: []})
      })
    } else {
      this.setState({chart: this.getBaseChart(), data: []})
    }
  }

  componentWillUnmount() {
    Chart.pluginService.unregister(chartPlugin)
  }

  componentDidUpdate = (prevProps) => {
    if ((this.props.networkToggle !== prevProps.networkToggle) || 
        (!prevProps.pool && this.props.pool) 
        || (prevProps.pool && !this.props.pool)
        || (prevProps.pool.address !== this.props.pool.address)) {
      this.componentDidMount()
    } else if (prevProps.isUnderlyingValue !== this.props.isUnderlyingValue
      || (!prevProps.currentValue && this.props.currentValue)) {
      this.setChart()
    }
  }

  formatNumber = (value) => {
    const precision = 1000000
    return parseFloat(fromDecimals(Math.round(value * precision), 6, 4, 1))
  }

  setChart() {
    Chart.pluginService.unregister(chartPlugin)
    let chart = this.getBaseChart()
    if (this.state.data.length) {
      const decimals = parseInt(this.props.isUnderlyingValue ? this.props.underlyingInfo.decimals : this.props.strikeAssetInfo.decimals)
      const underlyingPrecision = BigInt(10 ** parseInt(this.props.underlyingInfo.decimals))
      if (this.props.currentValue) {
        chart.datasets[0].data.push({x: Date.now(), y: this.formatNumber(this.props.currentValue)})
      }
      for (let i = 0; i < this.state.data.length; ++i) {
        let point = {x: new Date(this.state.data[i].t * 1000)}
        let value
        if (this.props.isUnderlyingValue) {
          value = BigInt(this.state.data[i].u) + (BigInt(this.state.data[i].s) * underlyingPrecision / BigInt(this.state.data[i].p))
        } else {
          value = BigInt(this.state.data[i].s) + (BigInt(this.state.data[i].u) * BigInt(this.state.data[i].p) / underlyingPrecision)
        }
        point.y = parseFloat(fromDecimals(value.toString(10), decimals, 5, 1))
        chart.datasets[0].data.push(point)
      }
    }
    this.setState({chart: chart}, () => Chart.pluginService.register(chartPlugin))
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
          layout: {padding: {left: -20, right: -20, top: 0, bottom: -20}},
          tooltips: {
            enabled: true,
            bodyFontFamily: 'Montserrat',
            titleFontFamily: 'Montserrat',
						mode: 'x-axis',
            displayColors: false,
						position: 'nearest',
            callbacks: {
              label: function(tooltipItem, data) {
                var numberFormat = new Intl.NumberFormat((navigator.language || navigator.languages[0] || 'en'));
                return numberFormat.format(tooltipItem.yLabel);
              },
              title: function(tooltipItem, data) {
                var dateFormat = new Intl.DateTimeFormat((navigator.language || navigator.languages[0] || 'en'),{year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});
                return dateFormat.format(new Date(tooltipItem[0].xLabel));
              }
            }
          }
        }} />
    </div>)
  } 
}
export default PerShareChart