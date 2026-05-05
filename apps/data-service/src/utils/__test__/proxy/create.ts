// @ts-nocheck
const createProxy = (fnOrObj = () => {}) => {
  const defaults = {
    fn: () => {},
    name: '@proxy',
    reservedFields: {},
  };
  let params;
  if (typeof fnOrObj === 'function') {
    params = {
      ...defaults,
      fn: fnOrObj,
    };
  } else {
    params = {
      ...defaults,
      ...fnOrObj,
    };
  }

  let toPrimitive;

  const p = new Proxy(params.fn, {
    apply: (_target, _thisArg, argumentsList) => {
      params.fn({ apply: argumentsList });
      return p;
    },
    get: (_, prop) => {
      if (prop === Symbol.toPrimitive) return toPrimitive;
      if (typeof params.reservedFields[prop] !== 'undefined') return params.reservedFields[prop];

      params.fn({ get: prop });
      return p;
    },
  });

  toPrimitive = () => params.name;

  return p;
};

export default createProxy;
