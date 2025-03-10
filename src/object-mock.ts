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

    if (-1 === stackLine.search(/object-mock\.(cjs|js|mjs|ts)/)) {
      return parseInt(stackLine.split(':')[1]);
    }
  }

  return undefined;
};
export type ObjectMocks<T extends Record<string, any>> = Array<
  {
    [K in keyof T]: T[K] extends (...parameters: Array<any>) => any
      ? ReturnType<T[K]> extends T
        ?
            | { name: K; parameters: Parameters<T[K]>; returnSelf: true; strict?: true }
            | { name: K; parameters: Parameters<T[K]>; error: Error; strict?: true }
            | { name: K; callback: T[K] }
        :
            | (ReturnType<T[K]> extends void
                ? { name: K; parameters: Parameters<T[K]>; strict?: true }
                : { name: K; parameters: Parameters<T[K]>; return: ReturnType<T[K]>; strict?: true })
            | { name: K; parameters: Parameters<T[K]>; error: Error; strict?: true }
            | { name: K; callback: T[K] }
      : { name: K; value: T[K] };
  }[keyof T]
>;

export const createObjectMock = <T extends Record<string, any>>(mocks: ObjectMocks<T>): T => {
  const line = internalResolveCallerLineFromStack(new Error().stack);

  // eslint-disable-next-line functional/no-let
  let mockIndex = 0;

  const object = new Proxy({} as T, {
    get: (_, actualName) => {
      // Promise.resolve
      if (actualName === 'then') {
        return;
      }

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

      if (actualName !== mock.name) {
        throw new Error(
          `Method name mismatch: ${formatContext({
            line,
            mockIndex,
            actual: actualName,
            expect: mock.name,
          })}`,
        );
      }

      if ('value' in mock) {
        mockIndex++;

        return mock.value;
      }

      return (...actualParameters: Parameters<T[keyof T]>) => {
        if ('callback' in mock) {
          mockIndex++;

          return mock.callback(...actualParameters);
        }

        if (actualParameters.length !== mock.parameters.length) {
          throw new Error(
            `Parameters count mismatch: ${formatContext({
              line,
              mockIndex,
              name: mock.name,
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
                  name: mock.name,
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
                  name: mock.name,
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

        if ('returnSelf' in mock) {
          return object;
        }

        if ('return' in mock) {
          return mock.return;
        }
      };
    },
  });

  return object;
};

export const useObjectMock = <T extends Record<string, any>>(mocks: ObjectMocks<T>): [T, ObjectMocks<T>] => {
  return [createObjectMock(mocks), mocks];
};
