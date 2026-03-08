import PropTypes from 'prop-types';
import React from 'react';
import { CAPTIONS } from '../../services/InfoService';
import { TOOLTIP_ID } from '../../shared/constants';

const Caption = ({ caption }) => {
  if (caption !== CAPTIONS.BLOCK_DELAY) return <span>{caption}:</span>;

  return (
    <div className="label-with-icon">
      <span>{caption}:</span>
      <div className="icon question" data-for={TOOLTIP_ID} data-tip="Per last 10k blocks"></div>
    </div>
  );
};

export class NetworkInfo extends React.PureComponent {
  static propTypes = {
    info: PropTypes.object.isRequired,
  };

  render() {
    return (
      <div className="grid grid-wrap">
        {Object.entries(this.props.info).map((entry) => {
          return (
            <div key={entry[0]} className="column-sm-6">
              <div className="line">
                <Caption caption={entry[0]} />
              </div>
              <div className="line">{entry[1]}</div>
            </div>
          );
        })}
      </div>
    );
  }
}
