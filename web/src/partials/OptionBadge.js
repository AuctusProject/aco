import './OptionBadge.css'
import React, { Component } from 'react'
import { getOptionName } from '../util/constants'

class OptionBadge extends Component {
  render() {
    var optionName = getOptionName(this.props.isCall)
    return (
      <div className={"option-badge " + (optionName.toLowerCase()+"-badge")}>
        {optionName}
      </div>)
  }
}
export default OptionBadge