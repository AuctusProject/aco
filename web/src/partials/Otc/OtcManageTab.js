import './OtcManageTab.css'
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'

class OtcManageTab extends Component {
  constructor(props) {
    super(props)
  }
  
  render() {
    return <div className="otc-manage-tab">
    </div>
  }
}

OtcManageTab.contextTypes = {
  web3: PropTypes.object
}
export default withRouter(OtcManageTab)