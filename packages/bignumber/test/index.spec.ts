import { BigNumber } from '../src/index.js';
import Long from 'long';

describe('BigNumber', () => {
  it('clone', () => {
    const bn = new BigNumber(10);
    const clone = bn.clone();

    expect(bn === clone).toBeFalsy();
  });

  it('add, sub', () => {
    const bn = new BigNumber(Number.MAX_SAFE_INTEGER);
    expect(bn.add(100).sub(Number.MAX_SAFE_INTEGER).toFixed()).toBe('100');
  });

  it('mul, div', () => {
    const bn = new BigNumber(Number.MAX_SAFE_INTEGER);
    expect(bn.mul(2).div(2).toFixed()).toBe(String(Number.MAX_SAFE_INTEGER));
  });

  it('pow', () => {
    const bn = new BigNumber(2);
    expect(bn.pow(10).toFixed()).toBe('1024');
  });

  it('sqrt', () => {
    const bn = new BigNumber(16);
    expect(bn.sqrt().toFixed()).toBe('4');
  });

  it('abs', () => {
    const bn = new BigNumber('-100');
    expect(bn.abs().toFixed()).toBe('100');
  });

  it('mod', () => {
    const bn = new BigNumber(5);
    expect(bn.mod(2).toFixed()).toBe('1');
  });

  describe('roundTo', () => {
    it('Without params', () => {
      expect(new BigNumber(2.5).roundTo().toFixed()).toBe('3');
      expect(new BigNumber(2.4).roundTo().toFixed()).toBe('2');
    });

    it('With decimals', () => {
      expect(new BigNumber(2.56789).roundTo(3).toFixed()).toBe('2.568');
      expect(new BigNumber(2.54321).roundTo(2).toFixed()).toBe('2.54');
    });

    describe('Check round mode', () => {
      it('ROUND_UP', () => {
        expect(new BigNumber(-2.01).roundTo(0, BigNumber.ROUND_MODE.ROUND_UP).toFixed()).toBe('-3');
        expect(new BigNumber(2.01).roundTo(0, BigNumber.ROUND_MODE.ROUND_UP).toFixed()).toBe('3');
      });

      it('ROUND_DOWN', () => {
        expect(new BigNumber(-2.9).roundTo(0, BigNumber.ROUND_MODE.ROUND_DOWN).toFixed()).toBe(
          '-2',
        );
        expect(new BigNumber(2.9).roundTo(0, BigNumber.ROUND_MODE.ROUND_DOWN).toFixed()).toBe('2');
      });

      it('ROUND_CEIL', () => {
        expect(new BigNumber(-2.01).roundTo(0, BigNumber.ROUND_MODE.ROUND_CEIL).toFixed()).toBe(
          '-2',
        );
        expect(new BigNumber(2.01).roundTo(0, BigNumber.ROUND_MODE.ROUND_CEIL).toFixed()).toBe('3');
      });

      it('ROUND_FLOOR', () => {
        expect(new BigNumber(-2.9).roundTo(0, BigNumber.ROUND_MODE.ROUND_FLOOR).toFixed()).toBe(
          '-3',
        );
        expect(new BigNumber(2.9).roundTo(0, BigNumber.ROUND_MODE.ROUND_FLOOR).toFixed()).toBe('2');
      });

      it('ROUND_HALF_UP', () => {
        expect(new BigNumber(-2.4).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_UP).toFixed()).toBe(
          '-2',
        );
        expect(new BigNumber(-2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_UP).toFixed()).toBe(
          '-3',
        );
        expect(new BigNumber(2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_UP).toFixed()).toBe(
          '3',
        );
        expect(new BigNumber(2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_UP).toFixed()).toBe(
          '3',
        );
      });

      it('ROUND_HALF_DOWN', () => {
        expect(new BigNumber(-2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_DOWN).toFixed()).toBe(
          '-2',
        );
        expect(new BigNumber(-2.6).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_DOWN).toFixed()).toBe(
          '-3',
        );
        expect(new BigNumber(2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_DOWN).toFixed()).toBe(
          '2',
        );
        expect(new BigNumber(2.6).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_DOWN).toFixed()).toBe(
          '3',
        );
      });

      it('ROUND_HALF_EVEN', () => {
        expect(new BigNumber(-2.4).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_EVEN).toFixed()).toBe(
          '-2',
        );
        expect(new BigNumber(-2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_EVEN).toFixed()).toBe(
          '-2',
        );
        expect(new BigNumber(-2.6).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_EVEN).toFixed()).toBe(
          '-3',
        );
        expect(new BigNumber(2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_EVEN).toFixed()).toBe(
          '2',
        );
        expect(new BigNumber(2.6).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_EVEN).toFixed()).toBe(
          '3',
        );
        expect(new BigNumber(2.4).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_EVEN).toFixed()).toBe(
          '2',
        );
      });

      it('ROUND_HALF_CEIL', () => {
        expect(new BigNumber(-2.4).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_CEIL).toFixed()).toBe(
          '-2',
        );
        expect(new BigNumber(-2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_CEIL).toFixed()).toBe(
          '-2',
        );
        expect(new BigNumber(-2.6).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_CEIL).toFixed()).toBe(
          '-3',
        );
        expect(new BigNumber(2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_CEIL).toFixed()).toBe(
          '3',
        );
        expect(new BigNumber(2.6).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_CEIL).toFixed()).toBe(
          '3',
        );
        expect(new BigNumber(2.4).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_CEIL).toFixed()).toBe(
          '2',
        );
      });

      it('ROUND_HALF_FLOOR', () => {
        expect(
          new BigNumber(-2.4).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_FLOOR).toFixed(),
        ).toBe('-2');
        expect(
          new BigNumber(-2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_FLOOR).toFixed(),
        ).toBe('-3');
        expect(
          new BigNumber(-2.6).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_FLOOR).toFixed(),
        ).toBe('-3');
        expect(new BigNumber(2.5).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_FLOOR).toFixed()).toBe(
          '2',
        );
        expect(new BigNumber(2.6).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_FLOOR).toFixed()).toBe(
          '3',
        );
        expect(new BigNumber(2.4).roundTo(0, BigNumber.ROUND_MODE.ROUND_HALF_FLOOR).toFixed()).toBe(
          '2',
        );
      });
    });
  });

  it('eq', () => {
    expect(new BigNumber(1).eq('1')).toBeTruthy();
  });

  it('lt', () => {
    expect(new BigNumber(1).lt('2')).toBeTruthy();
    expect(new BigNumber(1).lt('1')).toBeFalsy();
  });

  it('gt', () => {
    expect(new BigNumber(1).gt('0')).toBeTruthy();
    expect(new BigNumber(0).gt('0')).toBeFalsy();
  });

  it('lte', () => {
    expect(new BigNumber(1).lte('2')).toBeTruthy();
    expect(new BigNumber(1).lte('1')).toBeTruthy();
  });

  it('gte', () => {
    expect(new BigNumber(1).gte('0')).toBeTruthy();
    expect(new BigNumber(0).gte('0')).toBeTruthy();
  });

  it('isNaN', () => {
    expect(new BigNumber(NaN).isNaN()).toBeTruthy();
  });

  it('isFinite', () => {
    expect(new BigNumber(1).isFinite()).toBeTruthy();
    expect(new BigNumber(Infinity).isFinite()).toBeFalsy();
  });

  it('isZero', () => {
    expect(new BigNumber(0).isZero()).toBeTruthy();
  });

  it('isPositive', () => {
    expect(new BigNumber(1).isPositive()).toBeTruthy();
  });

  it('isNegative', () => {
    expect(new BigNumber(-1).isNegative()).toBeTruthy();
  });

  it('isInt', () => {
    expect(new BigNumber(1).isInt()).toBeTruthy();
    expect(new BigNumber(1.2).isInt()).toBeFalsy();
  });

  it('getDecimalsCount', () => {
    expect(new BigNumber(1).getDecimalsCount()).toBe(0);
    expect(new BigNumber(1.2).getDecimalsCount()).toBe(1);
    expect(new BigNumber(1.2231).getDecimalsCount()).toBe(4);
  });

  it('toBytes from not int', () => {
    expect(() => new BigNumber(1.2).toBytes()).toThrowError(
      'Cant create bytes from number with decimals!',
    );
  });

  it('From bytes with wrong bytes length', () => {
    expect(() => BigNumber.fromBytes(new Uint8Array([1, 2]))).toThrowError(
      'Wrong bytes length! Minimal length is 8 byte!',
    );
  });

  it('toBytes from ', () => {
    expect(() => BigNumber.fromBytes(new Uint8Array([1, 2]))).toThrowError(
      'Wrong bytes length! Minimal length is 8 byte!',
    );
  });

  describe('toBytes', () => {
    describe('Check isSigned', () => {
      it('isSigned = true and signed range values', () => {
        const values = [
          BigNumber.MIN_VALUE.toString(),
          '-365',
          '0',
          '1',
          '365',
          BigNumber.MAX_VALUE.toString(),
        ];

        values.forEach((value) => {
          const bignumberBytes = Array.from(new BigNumber(value).toBytes());
          const longBytes = Long.fromValue(value).toBytes();

          expect(bignumberBytes).toEqual(longBytes);
        });
      });

      it('should throw error with isSigned = true and numbers from wrong range', () => {
        const values = [
          BigNumber.MIN_VALUE.sub(1).toString(),
          BigNumber.MAX_VALUE.add(1).toString(),
        ];

        values.forEach((value) => {
          expect(() => new BigNumber(value).toBytes()).toThrowError(
            'Number is not from signed numbers range',
          );
        });
      });

      it('isSigned = false and unsigned range values', () => {
        const values = ['0', '1', '365', BigNumber.MAX_UNSIGNED_VALUE.toString()];

        values.forEach((value) => {
          const bignumberBytes = Array.from(new BigNumber(value).toBytes({ isSigned: false }));
          const longBytes = Long.fromValue(value).toBytes();

          expect(bignumberBytes).toEqual(longBytes);
        });
      });

      it('should throw error with isSigned = false and numbers from wrong range', () => {
        const values = [BigNumber.MAX_UNSIGNED_VALUE.add(1).toString()];

        values.forEach((value) => {
          expect(() => new BigNumber(value).toBytes({ isSigned: false })).toThrowError(
            'Number is not from unsigned numbers range',
          );
        });
      });

      it('should throw error with isSigned = false and negative number', () => {
        const value = BigNumber.MIN_UNSIGNED_VALUE.sub(1).toString();

        expect(() => new BigNumber(value).toBytes({ isSigned: false })).toThrowError(
          'Cant create bytes from negative number in signed mode',
        );
      });
    });

    describe('Check isLong', () => {
      it('isLong = false and signed range values', () => {
        const values = [
          BigNumber.MIN_VALUE.toString(),
          '-365',
          '0',
          '1',
          '365',
          BigNumber.MAX_VALUE.toString(),
        ];

        values.forEach((value) => {
          const bignumberBytes = Array.from(new BigNumber(value).toBytes({ isLong: false }));
          const longBytes = Long.fromValue(value).toBytes().slice(-bignumberBytes.length);

          expect(longBytes).toEqual(bignumberBytes);
        });
      });
    });
  });

  describe('fromBytes', () => {
    describe('Check isSigned', () => {
      it('isSigned = true and signed range values', () => {
        const values = [
          BigNumber.MIN_VALUE.toString(),
          '-365',
          '0',
          '1',
          '365',
          BigNumber.MAX_VALUE.toString(),
        ];

        values.forEach((value) => {
          const bytes = Long.fromValue(value).toBytes();

          expect(BigNumber.fromBytes(bytes).toFixed()).toEqual(value);
        });
      });

      it('isSigned = false and unsigned range values', () => {
        const values = ['0', '1', '365', BigNumber.MAX_UNSIGNED_VALUE.toString()];

        values.forEach((value) => {
          const bytes = Long.fromValue(value).toBytes();

          expect(BigNumber.fromBytes(bytes, { isSigned: false }).toFixed()).toEqual(value);
        });
      });
    });

    describe('Check isLong', () => {
      it('isLong = false and signed range values', () => {
        const values = [
          BigNumber.MIN_VALUE.toString(),
          '-365',
          '0',
          '1',
          '365',
          BigNumber.MAX_VALUE.toString(),
        ];

        values.forEach((value) => {
          const bytes = Long.fromValue(value).toBytes();

          expect(BigNumber.fromBytes(bytes, { isLong: false }).toFixed()).toEqual(value);
        });
      });
    });
  });

  it('toBytes, fromBytes', () => {
    const checkValue = [];
    let value = Long.MAX_VALUE;
    const step = Long.MAX_VALUE.div('10000');
    const checkMinValue = Long.MIN_VALUE.add(step);

    do {
      checkValue.push(value.toString());
      value = value.sub(step);
    } while (checkMinValue.lte(value));

    checkValue.push(Long.MIN_VALUE.toString());

    checkValue.forEach((value) => {
      const bytes = new BigNumber(value).toBytes();
      expect(Long.fromValue(value).toBytes()).toEqual(Array.from(bytes));

      try {
        expect(BigNumber.fromBytes(bytes).toFixed()).toEqual(value);
      } catch (cause) {
        throw new Error(
          `Bytes: ${bytes}, target: ${value}, result ${BigNumber.fromBytes(bytes).toFixed()}`,
          { cause },
        );
      }
    });
  });

  it('config, toFormat', () => {
    expect(new BigNumber('1000000.12312').toFormat()).toBe('1,000,000.12312');
    BigNumber.config.set({
      FORMAT: {
        groupSeparator: ' ',
      },
    });
    expect(new BigNumber('1000000.12312').toFormat()).toBe('1 000 000.12312');
  });

  it('toFixed', () => {
    expect(new BigNumber(234.5678).toFixed()).toBe('234.5678');
    expect(new BigNumber(234.5678).toFixed(1)).toBe('234.6');
    expect(new BigNumber(234.5678).toFixed(2)).toBe('234.57');
    expect(new BigNumber(234.5678).toFixed(3)).toBe('234.568');
    expect(new BigNumber(234.5678).toFixed(4)).toBe('234.5678');
    expect(new BigNumber(234.5678).toFixed(5)).toBe('234.56780');
  });

  it('toJSON', () => {
    expect(BigNumber.MAX_VALUE.toJSON()).toBe(BigNumber.MAX_VALUE.toFixed());
  });

  it('max', () => {
    expect(BigNumber.max(1, 3, 2).toFixed()).toBe('3');
  });

  it('min', () => {
    expect(BigNumber.min(2, 1, 3).toFixed()).toBe('1');
  });

  it('sum', () => {
    expect(BigNumber.sum(1, 2, 3).toFixed()).toBe('6');
  });

  it('toBigNumber', () => {
    expect(BigNumber.toBigNumber(1).toFixed()).toBe('1');
    expect(BigNumber.toBigNumber('1').toFixed()).toBe('1');
    expect(BigNumber.toBigNumber(['1', 2]).map((i) => i.toFixed())).toEqual(['1', '2']);
  });

  it('toString(16)', () => {
    expect(BigNumber.toBigNumber(255).toString()).toBe('255');
    expect(BigNumber.toBigNumber(255).toString(16)).toBe('ff');
  });

  describe('Enterprise-grade financial tests', () => {
    describe('toNumber - precision loss warning', () => {
      it('converts safe integers correctly', () => {
        expect(new BigNumber(100).toNumber()).toBe(100);
        expect(new BigNumber(Number.MAX_SAFE_INTEGER).toNumber()).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('loses precision for large values beyond MAX_SAFE_INTEGER', () => {
        const largeValue = new BigNumber(Number.MAX_SAFE_INTEGER).add(100);
        const converted = largeValue.toNumber();
        expect(Number.isSafeInteger(converted)).toBeFalsy();
      });

      it('converts negative values correctly', () => {
        expect(new BigNumber(-500).toNumber()).toBe(-500);
      });

      it('converts decimal values', () => {
        expect(new BigNumber(123.456).toNumber()).toBe(123.456);
      });
    });

    describe('valueOf - implicit coercion', () => {
      it('returns string representation for implicit coercion', () => {
        const bn = new BigNumber(42);
        expect(bn.valueOf()).toBe('42');
      });

      it('works with template literals', () => {
        const bn = new BigNumber(100.5);
        expect(`Value: ${bn}`).toBe('Value: 100.5');
      });

      it('handles negative values', () => {
        expect(new BigNumber(-999).valueOf()).toBe('-999');
      });
    });

    describe('isOdd / isEven - parity checks', () => {
      it('identifies even numbers', () => {
        expect(new BigNumber(0).isEven()).toBeTruthy();
        expect(new BigNumber(2).isEven()).toBeTruthy();
        expect(new BigNumber(100).isEven()).toBeTruthy();
        expect(new BigNumber(-4).isEven()).toBeTruthy();
      });

      it('identifies odd numbers', () => {
        expect(new BigNumber(1).isOdd()).toBeTruthy();
        expect(new BigNumber(3).isOdd()).toBeTruthy();
        expect(new BigNumber(99).isOdd()).toBeTruthy();
        expect(new BigNumber(-5).isOdd()).toBeTruthy();
      });

      it('works with large integers', () => {
        expect(new BigNumber(Number.MAX_SAFE_INTEGER).isOdd()).toBeTruthy();
        expect(new BigNumber(Number.MAX_SAFE_INTEGER).sub(1).isEven()).toBeTruthy();
      });
    });

    describe('isInSignedRange / isInUnsignedRange', () => {
      it('validates signed range boundaries', () => {
        expect(BigNumber.MIN_VALUE.isInSignedRange()).toBeTruthy();
        expect(BigNumber.MAX_VALUE.isInSignedRange()).toBeTruthy();
        expect(new BigNumber(0).isInSignedRange()).toBeTruthy();
      });

      it('detects out of signed range', () => {
        expect(BigNumber.MIN_VALUE.sub(1).isInSignedRange()).toBeFalsy();
        expect(BigNumber.MAX_VALUE.add(1).isInSignedRange()).toBeFalsy();
      });

      it('validates unsigned range boundaries', () => {
        expect(BigNumber.MIN_UNSIGNED_VALUE.isInUnsignedRange()).toBeTruthy();
        expect(BigNumber.MAX_UNSIGNED_VALUE.isInUnsignedRange()).toBeTruthy();
        expect(new BigNumber('9223372036854775808').isInUnsignedRange()).toBeTruthy();
      });

      it('detects out of unsigned range', () => {
        expect(new BigNumber(-1).isInUnsignedRange()).toBeFalsy();
        expect(BigNumber.MAX_UNSIGNED_VALUE.add(1).isInUnsignedRange()).toBeFalsy();
      });
    });

    describe('Config.set with ROUNDING_MODE', () => {
      it('accepts and sets ROUNDING_MODE configuration', () => {
        // This tests the else branch in Config.set (line 36)
        // ROUNDING_MODE is passed directly to BigNum.config without merging
        expect(() => {
          BigNumber.config.set({
            ROUNDING_MODE: BigNumber.ROUND_MODE.ROUND_DOWN,
          });
        }).not.toThrow();

        expect(() => {
          BigNumber.config.set({
            ROUNDING_MODE: BigNumber.ROUND_MODE.ROUND_UP,
          });
        }).not.toThrow();

        // Reset to default
        BigNumber.config.set({
          ROUNDING_MODE: BigNumber.ROUND_MODE.ROUND_HALF_UP,
        });
      });
    });

    describe('toFormat with custom format', () => {
      it('applies custom format parameters', () => {
        const customFormat = {
          prefix: '$',
          suffix: ' USD',
          groupSeparator: ',',
          decimalSeparator: '.',
          groupSize: 3,
          secondaryGroupSize: 0,
          fractionGroupSeparator: ' ',
          fractionGroupSize: 0,
        };
        expect(
          new BigNumber('1234567.89').toFormat(2, BigNumber.ROUND_MODE.ROUND_HALF_UP, customFormat),
        ).toBe('$1,234,567.89 USD');
      });

      it('uses custom decimal separator', () => {
        const format = {
          prefix: '',
          suffix: '',
          decimalSeparator: ',',
          groupSeparator: '.',
          groupSize: 3,
          secondaryGroupSize: 0,
          fractionGroupSeparator: ' ',
          fractionGroupSize: 0,
        };
        expect(
          new BigNumber('1000.50').toFormat(2, BigNumber.ROUND_MODE.ROUND_HALF_UP, format),
        ).toBe('1.000,50');
      });
    });

    describe('isBigNumber - type guard', () => {
      it('identifies BigNumber instances', () => {
        const bn = new BigNumber(100);
        expect(BigNumber.isBigNumber(bn)).toBeTruthy();
      });

      it('rejects non-objects', () => {
        expect(BigNumber.isBigNumber(null)).toBeFalsy();
        expect(BigNumber.isBigNumber(undefined)).toBeFalsy();
        expect(BigNumber.isBigNumber(123)).toBeFalsy();
        expect(BigNumber.isBigNumber('123')).toBeFalsy();
      });

      it('rejects plain objects', () => {
        expect(BigNumber.isBigNumber({})).toBeFalsy();
        expect(BigNumber.isBigNumber({ bn: 'test' })).toBeFalsy();
      });

      it('handles duck-typed objects', () => {
        const fakeBN = {
          bn: {},
          clone: () => {},
          add: () => {},
          sub: () => {},
        };
        const result = BigNumber.isBigNumber(fakeBN);
        expect(typeof result).toBe('boolean');
      });
    });

    describe('Immutability', () => {
      it('add does not mutate original', () => {
        const original = new BigNumber(10);
        const result = original.add(5);
        expect(original.toFixed()).toBe('10');
        expect(result.toFixed()).toBe('15');
      });

      it('sub does not mutate original', () => {
        const original = new BigNumber(10);
        const result = original.sub(3);
        expect(original.toFixed()).toBe('10');
        expect(result.toFixed()).toBe('7');
      });

      it('mul does not mutate original', () => {
        const original = new BigNumber(10);
        const result = original.mul(2);
        expect(original.toFixed()).toBe('10');
        expect(result.toFixed()).toBe('20');
      });

      it('div does not mutate original', () => {
        const original = new BigNumber(10);
        const result = original.div(2);
        expect(original.toFixed()).toBe('10');
        expect(result.toFixed()).toBe('5');
      });

      it('roundTo does not mutate original', () => {
        const original = new BigNumber(10.567);
        const result = original.roundTo(2);
        expect(original.toFixed()).toBe('10.567');
        expect(result.toFixed()).toBe('10.57');
      });
    });

    describe('Scientific notation', () => {
      it('parses scientific notation', () => {
        expect(new BigNumber('1e10').toFixed()).toBe('10000000000');
        expect(new BigNumber('1.5e3').toFixed()).toBe('1500');
        expect(new BigNumber('2.5e-2').toFixed()).toBe('0.025');
      });

      it('handles negative scientific notation', () => {
        expect(new BigNumber('-1e5').toFixed()).toBe('-100000');
      });
    });

    describe('toString with various bases', () => {
      it('converts to binary (base 2)', () => {
        expect(new BigNumber(255).toString(2)).toBe('11111111');
        expect(new BigNumber(8).toString(2)).toBe('1000');
      });

      it('converts to octal (base 8)', () => {
        expect(new BigNumber(64).toString(8)).toBe('100');
        expect(new BigNumber(255).toString(8)).toBe('377');
      });

      it('converts to hexadecimal (base 16)', () => {
        expect(new BigNumber(255).toString(16)).toBe('ff');
        expect(new BigNumber(4096).toString(16)).toBe('1000');
      });

      it('converts to base 36', () => {
        expect(new BigNumber(35).toString(36)).toBe('z');
        expect(new BigNumber(1295).toString(36)).toBe('zz');
      });
    });

    describe('Boundary operations', () => {
      it('operations at MIN_VALUE boundary', () => {
        const min = BigNumber.MIN_VALUE;
        expect(min.add(1).toFixed()).toBe('-9223372036854775807');
        expect(min.sub(1).toFixed()).toBe('-9223372036854775809');
      });

      it('operations at MAX_VALUE boundary', () => {
        const max = BigNumber.MAX_VALUE;
        expect(max.sub(1).toFixed()).toBe('9223372036854775806');
        expect(max.add(1).toFixed()).toBe('9223372036854775808');
      });

      it('operations at zero boundary', () => {
        expect(new BigNumber(0).sub(1).toFixed()).toBe('-1');
        expect(new BigNumber(0).add(1).toFixed()).toBe('1');
      });
    });

    describe('Chained operations', () => {
      it('chains arithmetic operations', () => {
        const result = new BigNumber(100).add(50).mul(2).div(3).roundTo(2);
        expect(result.toFixed()).toBe('100');
      });

      it('chains comparison operations', () => {
        const value = new BigNumber(10);
        expect(value.add(5).gt(10)).toBeTruthy();
        expect(value.sub(5).lt(10)).toBeTruthy();
      });

      it('complex financial calculation chain', () => {
        const principal = new BigNumber('1000000.00');
        const interestRate = new BigNumber('0.0525');
        const result = principal
          .mul(interestRate)
          .div(12)
          .roundTo(2, BigNumber.ROUND_MODE.ROUND_HALF_UP);
        expect(result.toFixed()).toBe('4375');
      });
    });

    describe('Division edge cases', () => {
      it('division by very small number', () => {
        const result = new BigNumber(1).div('0.00001');
        expect(result.toFixed()).toBe('100000');
      });

      it('handles division precision', () => {
        const result = new BigNumber(1).div(3);
        expect(result.roundTo(10).toFixed()).toBe('0.3333333333');
      });
    });

    describe('Negative zero handling', () => {
      it('treats negative zero as zero', () => {
        const negZero = new BigNumber(-0);
        expect(negZero.toFixed()).toBe('0');
        expect(negZero.isZero()).toBeTruthy();
        expect(negZero.isPositive()).toBeFalsy();
        expect(negZero.isNegative()).toBeFalsy();
      });
    });
  });
});
