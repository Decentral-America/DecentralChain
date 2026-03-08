import React from 'react';

const GenericParameter = ({ value }) => value.toString();

const StringParameter = ({ value }) => `"${value}"`;

const ParameterMapper = ({ type, value }) => {
  switch (type) {
    case 'string':
    case 'binary':
      return <StringParameter value={value} />;
    case 'list': {
      return (
        <React.Fragment key={`param${value}`}>
          [
          {value.map((x, i) => (
            <React.Fragment key={`param_${x.type}_${JSON.stringify(x.value)}`}>
              {ParameterMapper(x)}
              {value.length - 1 !== i ? ', ' : null}
            </React.Fragment>
          ))}
          ]
        </React.Fragment>
      );
    }
    default:
      return <GenericParameter value={value} />;
  }
};

export class InvocationInfoView extends React.Component {
  render() {
    return (
      <div className="data-container">
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {this.props.function}&nbsp; (
          {this.props.args.map((item, index) => {
            return (
              <React.Fragment key={`param_${item.type}_${JSON.stringify(item.value)}`}>
                {!!index && ', '}
                <ParameterMapper
                  key={`mapper_${item.type}_${JSON.stringify(item.value)}`}
                  {...item}
                />
              </React.Fragment>
            );
          })}
          )
        </div>
      </div>
    );
  }
}
