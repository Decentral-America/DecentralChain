import PropTypes from 'prop-types';
import React from 'react';

export class NoData extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
  };

  static defaultProps = {
    title: 'No data',
  };

  render() {
    const { title } = this.props;

    return (
      <div className="panel panel-empty no-data">
        <div className="icon"></div>
        <div className="line wide panel-empty-label">
          <span>{title}</span>
        </div>
      </div>
    );
  }
}
