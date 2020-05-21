import './Loading.css'
import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

class Loading extends Component {
  render() {
    return (
      <div className="loading-component">
        <FontAwesomeIcon icon={faSpinner} className="fa-spin"></FontAwesomeIcon>&nbsp;Loading...
      </div>)
  }
}
export default Loading