import React from 'react';
import DictionaryItem from '../DictionaryItem';
import Headline, { HeadlineSize } from '../Headline';

const DictionaryItemSection = ({ section, items }) => (
  <React.Fragment>
    {section !== 'default' && (
      <Headline title={section} size={HeadlineSize.Medium} copyVisible={false} />
    )}
    {items.map((item) => {
      return <DictionaryItem key={item.label} {...item} />;
    })}
  </React.Fragment>
);

export class Dictionary extends React.Component {
  render() {
    return (
      <div className="dictionary">
        {Object.keys(this.props.items).map((key) => {
          return <DictionaryItemSection key={key} section={key} items={this.props.items[key]} />;
        })}
      </div>
    );
  }
}
