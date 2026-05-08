const createProxy = (fnOrObj: ((...args: any[]) => any) | Record<string, any> = () => {}): any => {
  const defaults = {
    fn: () => {},
    name: '@proxy',
    reservedFields: {} as Record<string | symbol, any>,
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

  let toPrimitive: any;

  const p: any = new Proxy(params.fn, {
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
