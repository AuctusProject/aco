import './SimpleDropdown.css'
import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

class SimpleDropdown extends Component {  
  selectOption = (option) => {
    this.props.onSelectOption(option)
  }
  
  getOptionName = (option) => {
    return option.name + (this.props.isPlural ?  "s" : "")
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
            {this.props.selectedOption ? this.getOptionName(this.props.selectedOption) : <span className="simple-dropdown-placeholder">{this.props.placeholder ?? "Select"}</span>}
          </div>
        </div>}
        {this.props.options && 
          <div className="dropdown-menu" aria-labelledby="simpleDropdown">
            {this.props.options.map(option => 
              <div key={option.value} onClick={() => this.selectOption(option)} className="dropdown-item clickable" target="_self">
                {this.getOptionName(option)}
              </div>
            )}
          </div>}
      </li>
      </ul>)
  }
}
export default SimpleDropdown