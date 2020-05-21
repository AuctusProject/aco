import './FaqItem.css'
import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

import Card from 'react-bootstrap/Card'
import Accordion from 'react-bootstrap/Accordion'

class FaqItem extends Component {
  render() {
    var id = this.props.id
    return (
      <Card className="faq-item card">
        <Accordion.Collapse eventKey={id}>
          <Card.Body>{this.props.a}</Card.Body>
        </Accordion.Collapse>
        <Accordion.Toggle as={Card.Header} eventKey={id}>
          <FontAwesomeIcon icon={faChevronRight} />
          {this.props.q}
        </Accordion.Toggle>
      </Card>)
  }
}
export default FaqItem