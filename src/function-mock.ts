/* eslint-disable @typescript-eslint/no-invalid-void-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { deepStrictEqual } from 'assert';

const formatContext = (context: { [key: string]: unknown }): string => JSON.stringify(context);

export const internalResolveCallerLineFromStack = (stack?: string): number | undefined => {
  if (!stack) {
    return undefined;
  }

  const stackLines = stack.split('\n');

  for (const stackLine of stackLines) {
    if (-1 === stackLine.search(/at /)) {
      continue;
    }

    if (-1 === stackLine.search(/function-mock\.(cjs|js|mjs|ts)/)) {
      return parseInt(stackLine.split(':')[1]);
    }
  }

  return undefined;
};

export type FunctionMocks<T extends (...parameters: Array<any>) => any> = Array<
  | (ReturnType<T> extends void
      ? { parameters: Parameters<T>; strict?: true }
      : { parameters: Parameters<T>; return: ReturnType<T>; strict?: true })
  | { parameters: Parameters<T>; error: Error; strict?: true }
  | { callback: T }
  | T
>;

export const createFunctionMock = <T extends (...parameters: Array<any>) => any>(
  mocks: FunctionMocks<T>,
): ((...parameters: Parameters<T>) => ReturnType<T>) => {
  const line = internalResolveCallerLineFromStack(new Error().stack);

  // eslint-disable-next-line functional/no-let
  let mockIndex = 0;

  return (...actualParameters: Parameters<T>) => {
    // eslint-disable-next-line functional/immutable-data
    const mock = mocks.shift();

    if (!mock) {
      throw new Error(
        `Missing mock: ${formatContext({
          line,
          mockIndex,
        })}`,
      );
    }

    if (typeof mock === 'function') {
      mockIndex++;

      return mock(...actualParameters);
    }

    if ('callback' in mock) {
      mockIndex++;

      return mock.callback(...actualParameters);
    }

    if (actualParameters.length !== mock.parameters.length) {
      throw new Error(
        `Parameters count mismatch: ${formatContext({
          line,
          mockIndex,
          actual: actualParameters.length,
          expect: mock.parameters.length,
        })}`,
      );
    }

    mock.parameters.forEach((expect: unknown, parameterIndex: number) => {
      const actual = actualParameters[parameterIndex];

      if (mock.strict) {
        if (actual !== expect) {
          throw new Error(
            `Parameter mismatch: ${formatContext({
              line,
              mockIndex,
              parameterIndex,
              actual,
              expect,
              strict: true,
            })}`,
          );
        }
      } else {
        try {
          deepStrictEqual(actual, expect);
        } catch {
          throw new Error(
            `Parameter mismatch: ${formatContext({
              line,
              mockIndex,
              parameterIndex,
              actual,
              expect,
            })}`,
          );
        }
      }
    });

    mockIndex++;

    if ('error' in mock) {
      throw mock.error;
    }

    if ('return' in mock) {
      return mock.return;
    }
  };
};

export const useFunctionMock = <T extends (...parameters: Array<any>) => any>(
  mocks: FunctionMocks<T>,
): [(...parameters: Parameters<T>) => ReturnType<T>, FunctionMocks<T>] => {
  return [createFunctionMock(mocks), mocks];
};
