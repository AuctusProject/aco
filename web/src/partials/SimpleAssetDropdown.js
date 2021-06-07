import './SimpleAssetDropdown.css'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestionCircle, faSpinner } from '@fortawesome/free-solid-svg-icons'

class SimpleAssetDropdown extends Component {  
  selectOption = (option) => {
    this.props.onSelectOption(option)
  } 

  getAssetIcon = (asset) => {
    var iconUrl = this.context && this.context.assetsImages && this.context.assetsImages[asset.name]
    if (iconUrl) {
      return <img alt="" src={iconUrl}></img>
    }
    else {
      return <FontAwesomeIcon icon={faQuestionCircle}></FontAwesomeIcon>
    }
  }

  render() {
    var toggleDivClasses = ((this.props.options && this.props.options.length > 0) ? "dropdown-toggle clickable" : "")
    toggleDivClasses += !this.props.selectedOption ? " empty-select" : ""
    return (
      <ul className="simple-dropdown">
        <li className="nav-item dropdown simple-dropdown">                  
        {!this.props.options && <div><FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon></div>}
        {this.props.options && <div className={"nav-link " + toggleDivClasses} target="_self" id="simpleDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <div className="pair-nav-container">
            {this.props.selectedOption ? 
            <div className="asset-select-option">
              {this.getAssetIcon(this.props.selectedOption)}
              {this.props.selectedOption.name}
            </div> : <span className="simple-dropdown-placeholder">{this.props.placeholder ?? "Select"}</span>}
          </div>
        </div>}
        {this.props.options && 
          <div className="dropdown-menu" aria-labelledby="simpleDropdown">
            {this.props.options.map(option => 
              <div key={option.value} onClick={() => this.selectOption(option)} className="dropdown-item clickable" target="_self">
                <div className="asset-select-option">
                  {this.getAssetIcon(option)}
                  {option.name}
                </div>
              </div>
            )}
          </div>}
      </li>
      </ul>)
  }
}
SimpleAssetDropdown.contextTypes = {
  assetsImages: PropTypes.object
}
export default SimpleAssetDropdown