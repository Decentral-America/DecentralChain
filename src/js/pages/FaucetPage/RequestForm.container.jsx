import { ErrorMessage, Field, Form, Formik } from 'formik';
import PropTypes from 'prop-types';
import React from 'react';
import Recaptcha from 'react-google-recaptcha';

const RequestStatus = ({ status }) => {
  if (!status) {
    return null;
  }

  const className = `faucetValidation ${status.successful ? 'valid' : 'invalid'}`;
  const message =
    status.message || 'Your request was successfully submitted please check your wallet';

  return (
    <div className={className}>
      <div className="status-icon"></div>
      <div>{message}</div>
    </div>
  );
};

export class RequestForm extends React.Component {
  static propTypes = {
    networkName: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    validateAddress: PropTypes.func.isRequired,
    captchaKey: PropTypes.string.isRequired,
    amount: PropTypes.string,
    status: PropTypes.shape({
      successful: PropTypes.bool.isRequired,
      message: PropTypes.string,
    }),
  };

  static defaultProps = {
    amount: '2',
  };

  state = {
    captchaToken: null,
  };

  handleCaptchaChange = (value, validateForm) => {
    this.setState({ captchaToken: value }, validateForm);
  };

  validate = (values) => {
    return Promise.resolve()
      .then(() => {
        const errors = {};

        if (!values.address) {
          errors.address = 'Address is required';
        } else if (values.address.trim().length === 0) {
          errors.address = 'Address must be non-empty';
        }

        if (Object.keys(errors).length) {
          throw errors;
        }
      })
      .then(() => this.props.validateAddress(values.address))
      .then((addressValid) => {
        if (!addressValid) {
          throw {
            address: 'Invalid address',
          };
        }
      })
      .then(() => {
        if (!this.state.captchaToken) {
          throw {
            captchaToken: 'Captcha is required',
          };
        }
      });
  };

  render() {
    return (
      <Formik
        validate={this.validate}
        initialValues={{
          address: '',
        }}
        onSubmit={(values, actions) => {
          const aggregatedValues = Object.assign({}, values, this.state);
          this.props.onSubmit(aggregatedValues).then(() => actions.setSubmitting(false));
        }}
        validateOnChange={false}
        render={({ isSubmitting, isValid }) => (
          <Form>
            <span className="basic700 margin4">{this.props.networkName} Address</span>
            <span className="basic500 margin6 fs12">
              Fill out your {this.props.networkName} address to receive {this.props.amount} DCC
            </span>

            <div className="margin24 fs14">
              <Field name="address" type="text" placeholder="Address" className="basic500" />
              <ErrorMessage component="div" name="address" className="input-error" />
            </div>

            <span className="basic700 margin6">Confirm you're a human</span>
            <div className="margin24">
              <Recaptcha
                sitekey={this.props.captchaKey}
                onChange={(value) => this.handleCaptchaChange(value, validateForm)}
              />
              {errors.captchaToken && <div className="input-error">{errors.captchaToken}</div>}
            </div>

            <RequestStatus status={this.props.status} />

            <button
              className="submit big long get-dcc-btn"
              type="submit"
              disabled={!isValid || isSubmitting || isValidating}
            >
              <span>Request {this.props.amount} DCC</span>
            </button>
          </Form>
        )}
      />
    );
  }
}
