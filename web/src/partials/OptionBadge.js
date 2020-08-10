import './OptionBadge.css'
import React, { Component } from 'react'
import { getOptionName } from '../util/constants'

class OptionBadge extends Component {
  render() {
    var optionName = getOptionName(this.props.isCall)
    return (
      <div onClick={this.props.onClick} className={"option-badge " + (optionName.toLowerCase()+"-badge ") + (this.props.className ?? "")}>
        {optionName}
      </div>)
  }
}
export default OptionBadge