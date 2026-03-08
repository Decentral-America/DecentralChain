import PropTypes from 'prop-types';
import React from 'react';

const ListItem = ({ item, onSelect }) => (
  <button type="button" onClick={() => onSelect(item)}>
    {item.value}
  </button>
);

export const itemShape = PropTypes.shape({
  option: PropTypes.string,
  value: PropTypes.string,
});

export class SelectListView extends React.Component {
  static propTypes = {
    items: PropTypes.arrayOf(itemShape).isRequired,
    selectedItem: itemShape.isRequired,
    expanded: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    onSelectedItemChanged: PropTypes.func,
  };

  static defaultProps = {
    onSelectedItemChanged: () => {},
  };

  render() {
    const { items, selectedItem, expanded, onSelectedItemChanged } = this.props;
    const listClassName = `select-list${expanded ? ' expanded' : ''}`;

    return (
      <div className="select-list-container">
        <button type="button" className={listClassName} onClick={this.props.onToggle}>
          {selectedItem.value}
        </button>
        <div className="select-list-expanded">
          {items
            .filter((item) => item.option !== selectedItem.option)
            .map((item) => {
              return <ListItem key={item.option} item={item} onSelect={onSelectedItemChanged} />;
            })}
        </div>
      </div>
    );
  }
}
