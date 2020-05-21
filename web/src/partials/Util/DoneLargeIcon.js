import './DoneLargeIcon.css'
import React, { Component } from 'react'

class DoneLargeIcon extends Component {
  render() {
    return (
      <div className="done-large-icon">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="13" cy="13" r="12" stroke="#3CB34F" strokeWidth="2" />
            <path
                d="M8.99951 13.5712L12.1594 16.7271L18.3788 9.55469"
                stroke="#3CB34F"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
      </div>
  )}
}
export default DoneLargeIcon