import './SimpleManageTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'

class SimpleManageTab extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  render() {
    return <div className="simple-manage-tab">
      Manage
    </div>
  }
}

SimpleManageTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(SimpleManageTab)