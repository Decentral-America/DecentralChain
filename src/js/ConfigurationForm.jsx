import { Field, Form, Formik } from 'formik';
import PropTypes from 'prop-types';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard-ts';
import { isHttpsUri, isWebUri } from 'valid-url';
import { nodeApi } from './shared/api/NodeApi';

const valuesShape = PropTypes.shape({
  apiBaseUrl: PropTypes.string,
  spamListUrl: PropTypes.string,
});

const InputComponent = ({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  ...props
}) => (
  <div className="input-wrapper has-copy-button">
    <input type="text" {...field} {...props} className={errors[field.name] ? 'invalid' : ''} />
    <CopyToClipboard text={field.value}>
      <div className="copy-btn"></div>
    </CopyToClipboard>
    {touched[field.name] && errors[field.name] && (
      <div className="input-error">{errors[field.name]}</div>
    )}
  </div>
);

const validate = (values) => {
  return Promise.resolve()
    .then(() => {
      const url = values.apiBaseUrl.trim();
      if (!url) {
        return Promise.resolve({
          apiBaseUrl: 'Url is required',
        });
      }

      const currentProtocol = window.location.protocol;
      if (currentProtocol.startsWith('https') && !isHttpsUri(values.apiBaseUrl)) {
        return Promise.resolve({
          apiBaseUrl: `Invalid url. The url must match protocol definition (${currentProtocol})`,
        });
      }

      if (!isWebUri(values.apiBaseUrl)) {
        return Promise.resolve({
          apiBaseUrl: `Invalid url`,
        });
      }

      return nodeApi(values.apiBaseUrl)
        .version()
        .catch(() => {
          Promise.resolve({
            apiBaseUrl: 'Failed to connect to the specified node',
          });
        });
    })
    .then((versionResponse) => {
      if (versionResponse === undefined || !versionResponse.version) {
        return Promise.resolve({
          apiBaseUrl: `Node has failed to report it's version`,
        });
      }
    });
};

export default class ConfigurationForm extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    values: valuesShape.isRequired,
  };

  render() {
    return (
      <Formik
        initialValues={this.props.values}
        validate={validate}
        onSubmit={(values, actions) => {
          this.props.onSubmit(values);
          actions.setSubmitting(false);
          this.props.onClose();
        }}
      >
        {() => (
          <Form>
            <div className="header">
              Settings
              <button type="button" className="close-btn" onClick={this.props.onClose}></button>
            </div>
            <div className="row">
              <span>Blockchain Network</span>
              <div className="current-network">
                <i className="network-icon-active"></i>
                <span>{this.props.title}</span>
              </div>
            </div>

            <div className="row">
              <span>Node address</span>
              <Field
                name="apiBaseUrl"
                component={InputComponent}
                placeholder="Node absolute URL with port number"
              />
            </div>

            <div className="row buttons-wrapper">
              <button className="interface blue" type="submit" disabled={!touched || isSubmitting}>
                Save and apply
              </button>
            </div>
          </Form>
        )}
      </Formik>
    );
  }
}
