import './SimpleWriteTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'

class SimpleWriteTab extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  render() {
    return <div className="simple-write-tab">
      Write
    </div>
  }
}

SimpleWriteTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(SimpleWriteTab)