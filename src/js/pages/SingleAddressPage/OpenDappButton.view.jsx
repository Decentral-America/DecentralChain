import PropTypes from 'prop-types';

export const OpenDappButtonView = ({ children, onClick }) => (
  <button type="button" className="btn btn-open" onClick={onClick}>
    {children}
  </button>
);

OpenDappButtonView.propTypes = {
  onClick: PropTypes.func,
};

OpenDappButtonView.defaultProps = {
  onClick: () => {},
};
