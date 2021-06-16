import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import Modal from 'react-bootstrap/Modal'
import PoolAccountPosition from '../Pool/PoolAccountPosition'
import { getCollateralInfo } from '../../util/contractHelpers/acoTokenMethods'

class AccountPoolPositionModal extends Component {
  constructor(props) {
    super(props)
    this.state = { pool:null }
  }

  componentDidMount = () => {
    this.setPool()
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.pool !== prevProps.pool) {
      this.setPool()
    }
  }

  setPool = () => {
    var pool = this.props.pool && this.props.pool.poolData ? this.props.pool.poolData : null
    if (pool) {
      pool.acoPool = pool.address
      pool.acoPoolInfo = {decimals: getCollateralInfo(pool).decimals}
    }
    this.setState({pool: pool})
  }

  render() {
    return <Modal className="aco-modal no-header rewards-modal" centered={true} show={true} onHide={() => this.props.onHide(false)}>
      <Modal.Header closeButton></Modal.Header>
      <Modal.Body>
        <div className="rewards-title">
          {this.props.pool.name} REWARDS
        </div>
        {this.state.pool && <PoolAccountPosition pool={this.state.pool} balance={this.props.balance}/>}
      </Modal.Body>
    </Modal>
  }
}
export default withRouter(AccountPoolPositionModal)