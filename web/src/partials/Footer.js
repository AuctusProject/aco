import './Footer.css'
import React, { Component } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitter, faGithub, faDiscord } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'


class Footer extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  render() {
    return (
      <footer>
        <div className="container">
          <div className="row footer-text">
            <div className="col-sm-8 my-2">
              <div className="footer-links">
                <div className="footer-copyright">© 2020 ACO</div>
                <NavLink className="footer-link" to="/terms">Terms</NavLink>
                <NavLink className=" footer-link" to="/privacy">Privacy Policy</NavLink>
                <a className="footer-link" target="_blank" rel="noopener noreferrer" href="https://docs.aco.finance/faq">FAQ</a>
                <a className="footer-link" target="_blank" rel="noopener noreferrer" href="https://docs.aco.finance/">DOCS</a>
              </div>
            </div>
            <div className="col-sm-4 my-2">
              <div className="footer-social">
                <a rel="noopener noreferrer" href="mailto:contact@aco.finance"><FontAwesomeIcon icon={faEnvelope} /></a>
                <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/AcoFinance"><FontAwesomeIcon icon={faTwitter} /></a>
                <a target="_blank" rel="noopener noreferrer" href="https://discord.gg/9JqeMxs"><FontAwesomeIcon icon={faDiscord} /></a>
                <a target="_blank" rel="noopener noreferrer" href="https://github.com/AuctusProject/aco"><FontAwesomeIcon icon={faGithub} /></a>
              </div>
            </div>
          </div>
        </div>
      </footer>)
  }
}
export default withRouter(Footer)