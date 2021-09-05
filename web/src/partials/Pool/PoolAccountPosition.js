import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { formatWithPrecision, fromDecimals } from '../../util/constants'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getAccountPoolPosition } from '../../util/contractHelpers/acoPoolMethods'
import BigNumber from 'bignumber.js'
import { getCollateralInfo } from '../../util/contractHelpers/acoTokenMethods'

class PoolAccountPosition extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  componentDidMount = () => {
    this.getCurrentAccountPosition()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.networkToggle !== prevProps.networkToggle || this.props.balance !== prevProps.balance) {
      this.getCurrentAccountPosition()
    }
  }

  getTotalNetValue = (underlyingValue, strikeValue) => {
    if (underlyingValue || strikeValue) {      
      var underlyingConverted = fromDecimals(underlyingValue, this.props.pool.underlyingInfo.decimals, 4, 0)
      var strikeConverted = fromDecimals(strikeValue, this.props.pool.strikeAssetInfo.decimals, 4, 0)
      
      var totalDollar = Number(this.getUnderlyingValue(underlyingConverted)) + Number(strikeConverted)
            
      return `~$${formatWithPrecision(Number(totalDollar))}`
    }
    return null
  }

  getUnderlyingValue = (underlyingAmount) => {
    var underlyingPrice = this.context.ticker && this.context.ticker[this.props.pool.underlyingInfo.symbol]
    if (!underlyingPrice) {
      underlyingPrice = 0
    }
    return underlyingAmount * underlyingPrice
  }

  getCurrentAccountPosition = () => {
    this.setState({accountPosition: null}, () => {
      if (this.props.balance && this.props.balance > 0) {
        getAccountPoolPosition(this.props.pool.acoPool, this.props.balance).then(accountPosition => {
          this.setState({accountPosition: accountPosition})
        })
      }
    })
  }

  getAccountTotalNetValue = () => {  
    return this.getTotalNetValue(this.getValueTimesShares(this.props.pool.underlyingPerShare), this.getValueTimesShares(this.props.pool.strikeAssetPerShare))
  }

  getValueTimesShares = (value) => {
    var convertedShares = this.props.balance ? fromDecimals(this.props.balance, this.props.pool.acoPoolInfo.decimals) : 0
    return new BigNumber(convertedShares).times(new BigNumber(value))
  }
  
  render() {
    let pool = this.props.pool
    let underlyingBalanceFormatted = null
    let underlyingValueFormatted = null
    let strikeBalanceFormatted = null
    if (this.state.accountPosition) {
      let underlyingBalance = fromDecimals(this.state.accountPosition[0], pool.underlyingInfo.decimals, 4, 0)
      underlyingBalanceFormatted = underlyingBalance
      underlyingValueFormatted = formatWithPrecision(this.getUnderlyingValue(underlyingBalance))
      strikeBalanceFormatted = fromDecimals(this.state.accountPosition[1], pool.strikeAssetInfo.decimals, 4, 0)
    }

    return <>{!this.state.accountPosition ? 
        (this.props.balance && this.props.balance > 0 && <div className="vault-position">
          <div className="vault-position-title"><FontAwesomeIcon icon={faSpinner} className="fa-spin"/> Loading your position...</div>
        </div>)
        :
        <div className="vault-position">
          <div className="vault-position-title">Your position:</div>
          <div className="pool-net-value mb-3">
            Total Net Value: {this.getAccountTotalNetValue()}
          </div>
          <table className="aco-table mx-auto table-responsive-md">
            <thead>
              <tr>
                <th>Asset</th>
                <th className="value-highlight">Balance</th>
                <th className="value-highlight">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{this.props.pool.underlyingInfo.symbol}</td>
                <td className="value-highlight">{underlyingBalanceFormatted}</td>
                <td className="value-highlight">{underlyingValueFormatted}</td>
              </tr>
              <tr>
                <td>{this.props.pool.strikeAssetInfo.symbol}</td>
                <td className="value-highlight">{strikeBalanceFormatted}</td>
                <td className="value-highlight">{strikeBalanceFormatted}</td>
              </tr>
            </tbody>            
          </table>
          {this.state.accountPosition.acoTokensInfos && Object.values(this.state.accountPosition.acoTokensInfos).length > 0 && <><div className="vault-position-title mt-3">Open positions:</div>
          <table className="aco-table mx-auto table-responsive-md">
            <thead>
              <tr>
                <th>Asset</th>
                <th className="value-highlight">Open Position</th>
                <th className="value-highlight">Collateral Locked</th>
              </tr>
            </thead>
            <tbody>
            {this.state.accountPosition.acoTokensInfos && Object.values(this.state.accountPosition.acoTokensInfos).map(tokenPosition =>
              <tr key={tokenPosition.acoToken}>
                <td>{tokenPosition.acoTokenInfo.symbol}</td>
                <td className="value-highlight">{fromDecimals(tokenPosition.balance, tokenPosition.acoTokenInfo.decimals)}</td>
                <td className="value-highlight">{fromDecimals(tokenPosition.collateralAmount, getCollateralInfo(tokenPosition).decimals, 4, 0)}</td>
              </tr>)}
            </tbody>            
          </table></>}
        </div>}</>
  }
}

PoolAccountPosition.contextTypes = {
  assetsImages: PropTypes.object,
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default withRouter(PoolAccountPosition)