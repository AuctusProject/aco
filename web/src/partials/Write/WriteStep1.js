import './WriteStep1.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { OPTION_TYPES } from '../../util/constants'
import ReactTooltip from 'react-tooltip'

class WriteStep1 extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }  

  onCardClick = (type) => () => {
    this.props.setOptionType(type)
  }

  onInfoClick = (type) => (event) => {
    event.stopPropagation()
  }

  getTypeDescription = (optionType)  => {
    if (optionType === OPTION_TYPES[1]) {
      return "Earn premium on "+this.props.selectedPair.underlyingSymbol+" by writing covered "+optionType.name+" Options"
    }
    else {
      return "Earn premium on "+this.props.selectedPair.strikeAssetSymbol+" by writing secured "+optionType.name+" Options"
    }
  }

  getTypeTooltip = (optionType) => {
    return <ReactTooltip className="option-type-tooltip" id={optionType.id + ".option-tooltip"}>
      {optionType.id === 1 && <div>Receive money today for your willingness to sell ETH at the strike price. This potential income-generating options strategy is referred to as the covered call.</div>}
      {optionType.id === 2 && <div>Receive money today for your willingness to buy ETH at the strike price. It may seem a little counter-intuitive, but you can write puts to buy ETH. This options strategy is referred to as the cash-secured put.</div>}
    </ReactTooltip>
  }

  getTypeInfoUrl = (optionType) => {
    return optionType.id === 1 ?
    "https://docs.auctus.org/faq#how-to-write-a-call-option" :
    "https://docs.auctus.org/faq#how-to-write-a-put-option"      
  }

  render() {
    return <div className="write-step1">
        <div className="page-subtitle">Select which type of option you would like to write</div>
        <div className="option-types">
          {Object.values(OPTION_TYPES).map(optionType => (
            <div key={optionType.id} className={"option-type-card "+optionType.name.toLowerCase()} onClick={this.onCardClick(optionType.id)}>
              <a className="learn-more" href={this.getTypeInfoUrl(optionType)} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon data-tip data-for={optionType.id + ".option-tooltip"} icon={faInfoCircle} onClick={this.onInfoClick(optionType.id)}></FontAwesomeIcon>
                {this.getTypeTooltip(optionType)}
              </a>
              <div className="option-type-description">
                {this.getTypeDescription(optionType)}
              </div>          
              <div className="action-btn">WRITE {optionType.name}</div>
            </div>
          ))}
        </div>
      </div>
  }
}

WriteStep1.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(WriteStep1)