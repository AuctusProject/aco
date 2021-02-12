import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'

class DecimalInput extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: ""
    }
  }

  componentDidMount = () => {
    var value = ""
    if (this.props.value >= 0) {
      value = this.props.value
    }
    this.setState({value: value})
    
    if (this.props.setFocus) {
      this.focus()
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.value !== prevProps.value) {
      this.componentDidMount()
    }
    if (this.props.setFocus && this.props.setFocus !== prevProps.setFocus) {
      this.focus()
    }
  }

  onValueChange = (event) => {
    if (event.target.value) {
      var regex = this.getRegex()
      if (regex.test(event.target.value) ) {
        this.setState({value: event.target.value})
      }
    }
    else {
      this.setState({value: ""})
    }

    if (this.props.notifyOnChange) {
      this.props.onChange(event.target.value ? event.target.value : "")
    }
  }

  getRegex = () => {
    return this.props.decimals === 0 ? /^(\d*)$/ : /^(\d+(?:[.]\d{0,18})?)$/
  }

  focus = () => {
    this.decimalInputRef.select()
    this.props.onFocus()
  }

  onBlur = () => {
    var regex = this.getRegex()
    if (regex.test(this.state.value)) {
      var newValue = this.state.value
      this.props.onChange(newValue)
      this.setState({value: newValue})
    }
    else {
      this.props.onChange("")
    }
  }

  render() {
    return (
      <input 
        ref={ref => this.decimalInputRef = ref} 
        className={this.props.className} 
        placeholder={this.props.placeholder} 
        disabled={this.props.disabled} 
        value={this.state.value} 
        onBlur={this.onBlur} 
        onKeyPress={this.onKeyPress} 
        onChange={this.onValueChange}
        tabIndex={this.props.tabIndex}
      />
    )
  }
}
export default withRouter(DecimalInput)