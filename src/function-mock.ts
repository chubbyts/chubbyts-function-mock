/* eslint-disable @typescript-eslint/no-explicit-any */

import { deepStrictEqual } from 'assert';

const formatContext = (context: { [key: string]: unknown }): string => JSON.stringify(context, null, 2);

const resolveCallerLineFromStack = (stack?: string): number | undefined => {
  if (!stack) {
    return undefined;
  }

  const callerMatch = stack.match(/Object.(useFunctionMock|createFunctionMock|<anonymous>) \(([^)]+)\)/);

  if (callerMatch) {
    return callerMatch[2].split(':')[1] as unknown as number;
  }

  return undefined;
};

export type FunctionMocks<T extends (...parameters: Array<any>) => any> = Array<
  | { parameters: Parameters<T>; return: ReturnType<T>; strict?: true }
  | { parameters: Parameters<T>; error: Error; strict?: true }
  | { callback: T }
  | T
>;

export const createFunctionMock = <T extends (...parameters: Array<any>) => any>(
  mocks: FunctionMocks<T>,
): ((...parameters: Parameters<T>) => ReturnType<T>) => {
  const line = resolveCallerLineFromStack(new Error().stack);

  // eslint-disable-next-line functional/no-let
  let mockIndex = 0;

  return (...actualParameters: Parameters<T>): ReturnType<T> => {
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

    return mock.return;
  };
};

export const useFunctionMock = <T extends (...parameters: Array<any>) => any>(
  mocks: FunctionMocks<T>,
): [(...parameters: Parameters<T>) => ReturnType<T>, FunctionMocks<T>] => {
  return [createFunctionMock(mocks), mocks];
};
