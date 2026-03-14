export function isString(value: unknown): boolean {
  return typeof value === 'string';
}

const required = <T>(value: T | null | undefined): boolean => {
  return value != null;
};

export const charsInDictionary = (dictionary: string) => (value: string) =>
  value.split('').every((char) => dictionary.includes(char));

export const createValidator = <T>(
  validateFunction: (data: T) => boolean,
  message: string,
): IValidator<T> => {
  return (data: T) => {
    if (validateFunction(data)) {
      return null;
    } else {
      return message;
    }
  };
};

export const requiredValidator: <T>(property: string) => IValidator<T> = (property: string) =>
  createValidator(required, `Property "${property}" is required!`);

export function validate<R>(...validators: IValidator<R>[]): (data: R) => R {
  return (data: R) => {
    const errors = validators.reduce<string[]>((errs, validator) => {
      const message = validator(data);
      if (message) {
        errs.push(message);
      }
      return errs;
    }, []);

    if (errors.length) {
      throw new Error(`Validation error! Details: ${JSON.stringify(errors, null, 4)}`);
    }

    return data;
  };
}

type IValidator<T> = (data: T) => string | null;
