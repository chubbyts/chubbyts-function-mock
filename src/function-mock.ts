const formatContext = (context: { [key: string]: unknown }): string => JSON.stringify(context, null, 2);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createFunctionMock = <T extends (...parameters: Array<any>) => any>(
  mocks: Array<{ parameters: Parameters<T>; return: ReturnType<T> } | T>,
) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const [_, line] = new Error().stack.match(/Object.<anonymous> \(([^)]+)\)/)[1].split(':');

  // eslint-disable-next-line functional/no-let
  let mockIndex = 0;

  return (...actualParameters: Parameters<T>) => {
    // eslint-disable-next-line functional/immutable-data
    const mock = mocks.shift();

    if (typeof mock === 'function') {
      mockIndex++;

      return mock(...actualParameters);
    }

    if (!mock) {
      throw new Error(
        `Missing mock: ${formatContext({
          line,
          mockIndex,
        })}`,
      );
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
    });

    mockIndex++;

    return mock.return;
  };
};
