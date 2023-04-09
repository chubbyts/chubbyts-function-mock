const formatContext = (context: { [key: string]: unknown }): string => JSON.stringify(context, null, 2);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ObjectMocks<T extends Record<string, any>> = Array<
  | { name: keyof T; value: T[keyof T] } // property
  | { name: keyof T; parameters: Parameters<T[keyof T]>; return: ReturnType<T[keyof T]> }
  | { name: keyof T; parameters: Parameters<T[keyof T]>; returnSelf: true }
  | { name: keyof T; parameters: Parameters<T[keyof T]>; error: Error }
  | { name: keyof T; callback: T[keyof T] }
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createObjectMock = <T extends Record<string, any>>(mocks: ObjectMocks<T>): T => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const [_, line] = new Error().stack.match(/Object.<anonymous> \(([^)]+)\)/)[1].split(':');

  // eslint-disable-next-line functional/no-let
  let mockIndex = 0;

  const object = new Proxy({} as T, {
    get: (_, actualName) => {
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

      return (...actualParameters: Parameters<T[keyof T]>): ReturnType<T[keyof T]> | T => {
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

          if (actual !== expect) {
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
        });

        mockIndex++;

        if ('error' in mock) {
          throw mock.error;
        }

        if ('returnSelf' in mock) {
          return object;
        }

        return mock.return;
      };
    },
  });

  return object;
};
