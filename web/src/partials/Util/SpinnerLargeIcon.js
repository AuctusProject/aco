import './SpinnerLargeIcon.css'
import React, { Component } from 'react'

class SpinnerLargeIcon extends Component {
  render() {
    return (
      <div className="spinner-large-icon">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="13" cy="13" r="12" stroke="#5de9d4" strokeOpacity="0.2" strokeWidth="2" />
            <path
                d="M13 25C19.6274 25 25 19.6274 25 13C25 6.37258 19.6274 1 13 1"
                stroke="#5de9d4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
      </div>
  )}
}
export default SpinnerLargeIcon