import PropTypes from 'prop-types';

export const BalanceDetails = ({ balance }) => {
  return (
    <div className="info-box grid grid-wrap">
      <div>
        <div className="line">
          <span>Regular Balance</span>
        </div>
        <div className="line">{balance.regular}</div>
      </div>
      <div>
        <div className="line">
          <span>Generating Balance</span>
        </div>
        <div className="line">{balance.generating}</div>
      </div>
      <div>
        <div className="line">
          <span>Available Balance</span>
        </div>
        <div className="line">{balance.available}</div>
      </div>
      <div>
        <div className="line">
          <span>Effective Balance</span>
        </div>
        <div className="line">{balance.effective}</div>
      </div>
    </div>
  );
};

BalanceDetails.propTypes = {
  balance: PropTypes.shape({
    regular: PropTypes.string,
    generating: PropTypes.string,
    available: PropTypes.string,
    effective: PropTypes.string,
  }),
};
