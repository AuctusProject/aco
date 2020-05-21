import './StepIndicator.css'
import React, { Component } from 'react'

class StepIndicator extends Component {

  onIndicatorClick = (step) => () => {
    if (step < this.props.current) {
      this.props.setCurrentStep(step)
    }
  }

  render() {
    var steps = [];
    for (var i = 1; i <= this.props.totalSteps; i++) {
      steps.push(i)
    }

    return (
      <div className="steps-indicator">
        {steps.map(step => (
          <div key={step} onClick={this.onIndicatorClick(step)} className={"step-item " + (step === this.props.current ? "current" : (step < this.props.current ? "done" : ""))}>
            <div className="circle"></div>
            <div className="step-description">Step {step}</div>
          </div>
        ))}
      </div>)
  }
}
export default StepIndicator