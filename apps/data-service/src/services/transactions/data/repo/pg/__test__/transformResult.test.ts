import transformResult from '../transformResult';

const before = [
  {
    data_key: 'testint',
    data_type: 'integer',
    data_value_binary: null,
    data_value_boolean: null,
    data_value_integer: 11,
    data_value_string: null,
    id: 'qwe',
    position_in_tx: 0,
  },
  {
    data_key: 'testbool',
    data_type: 'boolean',
    data_value_binary: null,
    data_value_boolean: false,
    data_value_integer: null,
    data_value_string: null,
    id: 'qwe',
    position_in_tx: 1,
  },
  {
    data_key: 'testbinary',
    data_type: 'binary',
    data_value_binary: 'base64:qwerqwer',
    data_value_boolean: null,
    data_value_integer: null,
    data_value_string: null,
    id: 'asd',
    position_in_tx: 1,
  },
  {
    data_key: 'teststring',
    data_type: 'string',
    data_value_binary: null,
    data_value_boolean: null,
    data_value_integer: 11,
    data_value_string: 'some string',
    id: 'asd',
    position_in_tx: 0,
  },
];

describe('Data transactions db result transform', () => {
  it('should group raw results by transaction and put nested `data` inside \
    preserving order in position_in_tx field', () => {
    expect(transformResult(before)).toMatchSnapshot();
  });

  it('should handle case when there is no data in tx (all nulls in a row)', () => {
    expect(
      transformResult([
        {
          data_key: null,
          data_type: null,
          data_value_binary: null,
          data_value_boolean: null,
          data_value_integer: null,
          data_value_string: null,
          id: 'asd',
        },
      ]),
    ).toMatchSnapshot();
  });

  it('should return empty list for undefined, null or []', () => {
    expect(transformResult(undefined)).toEqual([]);
    expect(transformResult(null)).toEqual([]);
    expect(transformResult([])).toEqual([]);
  });
});
