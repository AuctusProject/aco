import { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { getTimeToExpiry } from '../../util/constants'

class ExpiryCountdown extends Component {
  constructor() {
    super()
    this.state = { timeToExpiry: "" }
  }
  
  componentDidMount = () => {
    setTimeout(() =>
      this.setTimeToExpiryLabel(), 1000)
  }

  setTimeToExpiryLabel = () => {
    var timeToExpiry = getTimeToExpiry(parseInt(this.props.expiry))
    var label = timeToExpiry.days > 0 ? 
        `${timeToExpiry.days}d ${timeToExpiry.hours}h` :
        timeToExpiry.hours > 0 ? `${timeToExpiry.hours}h ${timeToExpiry.minutes}m` :
        `${timeToExpiry.minutes}m ${timeToExpiry.seconds}s`;

    this.setState({timeToExpiry: label}, this.componentDidMount)
  }
  
  render() {
    return this.state.timeToExpiry
  }
}
export default withRouter(ExpiryCountdown)