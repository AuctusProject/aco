import './PoolCurrentTab.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { formatPercentage, fromDecimals, numberWithCommas } from '../../util/constants'
import { getCollateralInfo, getExerciseInfo } from '../../util/acoTokenMethods'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import RestoreModal from './RestoreModal'
import RedeemModal from './RedeemModal'

class PoolCurrentTab extends Component {
  constructor() {
    super()
    this.state = {
    }
  }

  getUnderlyingValue = (underlyingAmount) => {
    var underlyingPrice = this.context.ticker && this.context.ticker[this.props.pool.underlyingInfo.symbol]
    if (!underlyingPrice) {
      underlyingPrice = 0
    }
    return underlyingAmount * underlyingPrice
  }

  getUnderlyingAndStrikeFormattedValue = (underlyingValue, strikeValue) => {
    var totalDollar = this.getUnderlyingAndStrikeValue(underlyingValue, strikeValue)
    return this.formatDolarValue(totalDollar)
  }

  getUnderlyingAndStrikeValue = (underlyingValue, strikeValue) => {
    if (underlyingValue || strikeValue) {
      var underlyingConverted = fromDecimals(underlyingValue, this.props.pool.underlyingInfo.decimals, 4, 0)
      var strikeConverted = fromDecimals(strikeValue, this.props.pool.strikeAssetInfo.decimals, 4, 0)

      return Number(this.getUnderlyingValue(underlyingConverted)) + Number(strikeConverted)
    }
    return null
  }

  getValuePerShare = () => {
    let pool = this.props.pool
    return this.getUnderlyingAndStrikeFormattedValue(pool.underlyingPerShare, pool.strikeAssetPerShare)
  }

  getUtilizationRate = () => {
    let pool = this.props.pool
    var totalValue = fromDecimals(pool.totalValue, pool.strikeAssetInfo.decimals)
    var openPosition = Number(fromDecimals(pool.netValue, pool.strikeAssetInfo.decimals))
    return totalValue > 0 ? formatPercentage(openPosition / totalValue, 0) : "-"
  }

  getLiquidityAvailable = () => {
    let pool = this.props.pool
    return this.getUnderlyingAndStrikeFormattedValue(pool.underlyingBalance, pool.strikeAssetBalance)
  }

  getOpenPositions = () => {
    let pool = this.props.pool
    var openPosition = fromDecimals(pool.netValue, pool.strikeAssetInfo.decimals)
    return this.formatDolarValue(openPosition)
  }

  getNetValue = () => {
    let pool = this.props.pool
    var totalValue = fromDecimals(pool.totalValue, pool.strikeAssetInfo.decimals)
    return this.formatDolarValue(totalValue)
  }

  formatDolarValue = (value) => {
    
    if (value !== null) {
      return `$${numberWithCommas(Number(value).toFixed(2))}`
    }
    return "-"
  }

  getCollateralValue = (amount) => {
    var pool = this.props.pool
    var collateral = getCollateralInfo(pool)
    var price = this.context.ticker && this.context.ticker[collateral.symbol]
    if (!price) {
      price = 0
    }
    return amount * price
  }

  showConvertLiquidity = () => {
    return this.props.isAdmin && ((this.props.pool.isCall && this.props.pool.strikeAssetBalance > 0) ||
      (!this.props.pool.isCall && this.props.pool.underlyingBalance > 0))
  }

  showRedeem = () => {
    let pool = this.props.pool
    return this.props.isAdmin && pool.openAcos && pool.openAcos.length > 0
  }

  getRestoreButtonLabel = () => {
    let pool = this.props.pool
    var collateral = getCollateralInfo(pool).symbol
    var exercise = getExerciseInfo(pool).symbol
    return <>Convert {exercise} <FontAwesomeIcon icon={faArrowRight} /> {collateral}</>
  }

  onRedeemClick = () => {
    this.setState({showRedeemModal: true})
  }

  onHideRedeemModal = (refresh) => {
    if (refresh) {
      this.props.refresh()
    }
    this.setState({showRedeemModal: false})
  }

  onConvertLiquidityClick = () => {
    this.setState({showRestoreModal: true})
  }

  onHideRestoreModal = (refresh) => {
    if (refresh) {
      this.props.refresh()
    }
    this.setState({showRestoreModal: false})
  }

  render() {
    let pool = this.props.pool

    let underlyingBalance = fromDecimals(pool.underlyingBalance, pool.underlyingInfo.decimals, 4, 0)
    let underlyingBalanceFormatted = underlyingBalance
    let underlyingValueFormatted = this.formatDolarValue(this.getUnderlyingValue(underlyingBalance))
    let strikeBalanceFormatted = fromDecimals(pool.strikeAssetBalance, pool.strikeAssetInfo.decimals, 4, 0)

    return (
      <div className="pool-current-tab">
        <div className="pool-current-itens-row">
          <div className="pool-current-item">
            <div className="pool-current-item-label">Total net value</div>
            <div className="pool-current-item-value">{this.getNetValue()}</div>
          </div>
          <div className="pool-current-item">
            <div className="pool-current-item-label">Supply</div>
            <div className="pool-current-item-value">{fromDecimals(pool.totalSupply, getCollateralInfo(pool).decimals)}</div>
          </div>
          <div className="pool-current-item">
            <div className="pool-current-item-label">Value per share</div>
            <div className="pool-current-item-value">{this.getValuePerShare()}</div>
          </div>
          <div className="pool-current-item">
            <div className="pool-current-item-label">Utilization rate</div>
            <div className="pool-current-item-value">{this.getUtilizationRate()}</div>
          </div>
        </div>
        <div className="pool-item-details">
          <div className="pool-item-details-label">Liquidity available</div>
          <div className="pool-item-details-value">{this.getLiquidityAvailable()}</div>
        </div>
        {this.showConvertLiquidity() && <div className="admin-button-wrapper">
          <div className="action-btn" onClick={this.onConvertLiquidityClick}>{this.getRestoreButtonLabel()}</div>
        </div>}
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
              <td className="value-highlight">{this.formatDolarValue(strikeBalanceFormatted)}</td>
            </tr>
          </tbody>
        </table>
        <div className="pool-item-details">
          <div className="pool-item-details-label">Open positions</div>
          <div className="pool-item-details-value">{this.getOpenPositions()}</div>
        </div>
        {this.showRedeem() && <div className="admin-button-wrapper">
          <div className="aco-button action-btn" onClick={this.onRedeemClick}>Redeem collateral from expired options</div>
        </div>}
        {pool.openAcos && pool.openAcos.length > 0 &&
          <table className="aco-table mx-auto table-responsive-md">
            <thead>
              <tr>
                <th>Asset</th>
                <th className="value-highlight">Open Position</th>
                <th className="value-highlight">Options Value</th>
                <th className="value-highlight">Collateral Locked</th>
                <th className="value-highlight">Net Value</th>
              </tr>
            </thead>
            <tbody>
              {pool.openAcos && pool.openAcos.map(openAco =>
                <tr key={openAco.address}>
                  <td>{openAco.name}</td>
                  <td className="value-highlight">{fromDecimals(-openAco.tokenAmount, pool.underlyingInfo.decimals)}</td>
                  <td className="value-highlight">-{this.formatDolarValue(fromDecimals(openAco.openPositionOptionsValue, pool.strikeAssetInfo.decimals, 4, 0))}</td>
                  <td className="value-highlight">{this.formatDolarValue(fromDecimals(openAco.collateralLockedValue, getCollateralInfo(pool).decimals, 4, 0))}</td>
                  <td className="value-highlight">{this.formatDolarValue(fromDecimals(openAco.netValue, pool.strikeAssetInfo.decimals, 4, 0))}</td>
                </tr>)}
            </tbody>
          </table>}
          {this.state.showRestoreModal && <RestoreModal onHide={this.onHideRestoreModal} title={this.getRestoreButtonLabel()} pool={pool}/>}
          {this.state.showRedeemModal && <RedeemModal onHide={this.onHideRedeemModal} pool={pool}/>}
      </div>)
  }
}

PoolCurrentTab.contextTypes = {
  assetsImages: PropTypes.object,
  web3: PropTypes.object,
  ticker: PropTypes.object
}
export default PoolCurrentTab