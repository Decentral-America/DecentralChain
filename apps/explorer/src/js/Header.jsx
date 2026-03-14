import PropTypes from 'prop-types';
import { withRouter } from './withRouter';

const Header = (props) => {
  return (
    <div className="header grid">
      <div className="header-title grid-item-fixed grid">
        <button
          type="button"
          className="menu-toggle grid-item-fixed lg-show"
          onClick={() => props.onMenuToggle()}
        >
          <span className="middle-bar"></span>
        </button>
        <div className="logo">
          <a href="/" aria-label="Home">
            <span hidden>Home</span>
          </a>
        </div>
      </div>
      {props.children}
    </div>
  );
};

Header.propTypes = {
  onMenuToggle: PropTypes.func.isRequired,
};

export default withRouter(Header);
