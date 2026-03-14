import PropTypes from 'prop-types';
import React from 'react';

import NoData from '../../components/NoData';
import { GroupedAliasListItem } from './GroupedAliasListItem.view';

export class GroupedAliasList extends React.Component {
  static propTypes = {
    aliases: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  render() {
    return (
      <React.Fragment>
        <table className="address-alias-list">
          <thead>
            <tr>
              <th className="letter">Alias</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {this.props.aliases.map((aliasGroup) => {
              return <GroupedAliasListItem key={aliasGroup.letter} aliasGroup={aliasGroup} />;
            })}
          </tbody>
        </table>
        {this.props.aliases.length === 0 && <NoData title="No aliases yet" />}
      </React.Fragment>
    );
  }
}
