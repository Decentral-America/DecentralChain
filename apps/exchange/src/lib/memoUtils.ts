import { type DependencyList, memo, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';

/**
 * Generic memoized component wrapper
 * Wraps a component with React.memo for automatic re-render prevention
 */
export const memoComponent = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean,
): React.MemoExoticComponent<React.ComponentType<P>> => {
  return memo(Component, propsAreEqual);
};

/**
 * Memoize a computed value
 * Wrapper around useMemo with better typing
 */
export const useMemoizedValue = <T>(factory: () => T, deps: DependencyList): T => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps array is passed through from caller
  return useMemo(factory, deps);
};

/**
 * Memoize a callback function
 * Wrapper around useCallback with better typing
 */
export const useMemoizedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: DependencyList,
): T => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps array is passed through from caller
  return useCallback(callback, deps) as T;
};

/**
 * Shallow comparison for props equality check
 * Useful for React.memo when only shallow comparison is needed
 */
export const shallowEqual = <T extends Record<string, unknown>>(
  prevProps: T,
  nextProps: T,
): boolean => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Deep comparison for props equality check
 * Use sparingly as it's more expensive than shallow comparison
 */
export const deepEqual = <T>(prev: T, next: T): boolean => {
  if (prev === next) {
    return true;
  }

  if (typeof prev !== 'object' || typeof next !== 'object' || prev === null || next === null) {
    return false;
  }

  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (
      !deepEqual((prev as Record<string, unknown>)[key], (next as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }

  return true;
};

/**
 * Memoize an expensive calculation with custom equality check
 */
export const useMemoWithEqualityCheck = <T>(
  factory: () => T,
  deps: DependencyList,
  equalityFn: (prev: T | undefined, next: T) => boolean,
): T => {
  const valueRef = useMemo(() => ({ current: undefined as T | undefined }), []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps array is passed through from caller
  const newValue = useMemo(factory, deps);

  if (!equalityFn(valueRef.current, newValue)) {
    valueRef.current = newValue;
  }

  return valueRef.current as T;
};

/**
 * Create a memoized selector function
 * Useful for deriving data from state/props
 */
export const createMemoizedSelector = <TInput, TOutput>(
  selector: (input: TInput) => TOutput,
  equalityFn?: (prev: TOutput, next: TOutput) => boolean,
) => {
  let lastInput: TInput | undefined;
  let lastOutput: TOutput | undefined;

  return (input: TInput): TOutput => {
    if (lastInput === input && lastOutput !== undefined) {
      return lastOutput;
    }

    const output = selector(input);

    if (equalityFn && lastOutput !== undefined && equalityFn(lastOutput, output)) {
      return lastOutput;
    }

    lastInput = input;
    lastOutput = output;
    return output;
  };
};

/**
 * Memoize array of objects by comparing specific keys
 */
export const useMemoizedArray = <T extends Record<string, unknown>>(
  array: T[],
  compareKeys?: (keyof T)[],
): T[] => {
  return useMemo(() => {
    if (!compareKeys || compareKeys.length === 0) {
      return array;
    }

    return array.map((item) => {
      const memoized: Partial<T> = {};
      compareKeys.forEach((key) => {
        memoized[key] = item[key];
      });
      return { ...item, ...memoized };
    });
  }, [array, compareKeys]);
};

/**
 * Debounced memoization
 * Only recompute after a delay when dependencies change
 */
export const useDebouncedMemo = <T>(
  factory: () => T,
  deps: DependencyList,
  delay: number = 300,
): T => {
  const timeoutRef = useMemo(() => ({ current: undefined as NodeJS.Timeout | undefined }), []);
  const valueRef = useMemo(() => ({ current: factory() }), [factory]);

  useMemo(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      valueRef.current = factory();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps array is passed through from caller
  }, deps);

  return valueRef.current;
};

/**
 * Memoize an object by keys
 * Only recompute when specified keys change
 */
export const useMemoizedObject = <T extends Record<string, unknown>>(
  obj: T,
  keys?: (keyof T)[],
): T => {
  return useMemo(() => {
    if (!keys || keys.length === 0) {
      return obj;
    }

    const memoized: Partial<T> = {};
    keys.forEach((key) => {
      memoized[key] = obj[key];
    });

    return { ...obj, ...memoized };
  }, [obj, keys]);
};

/**
 * Performance monitoring wrapper
 * Logs render count and reasons in development
 */
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
): React.MemoExoticComponent<React.ComponentType<P>> => {
  let renderCount = 0;

  return memo(Component, (prevProps, nextProps) => {
    if (process.env.NODE_ENV === 'development') {
      renderCount++;
      logger.debug(`[${componentName}] Render #${renderCount}`);

      const changedProps: string[] = [];
      (Object.keys(prevProps) as (keyof P)[]).forEach((key) => {
        if (prevProps[key] !== nextProps[key]) {
          changedProps.push(key as string);
        }
      });

      if (changedProps.length > 0) {
        logger.debug(`[${componentName}] Changed props:`, changedProps);
      }
    }

    return shallowEqual(prevProps as Record<string, unknown>, nextProps as Record<string, unknown>);
  });
};
