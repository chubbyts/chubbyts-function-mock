import { describe, expect, test } from 'vitest';
import type { FunctionMocks } from '../src/function-mock';
import { internalResolveCallerLineFromStack, createFunctionMock, useFunctionMock } from '../src/function-mock';

type MyFunction = (string: string, start: number, stop: number, context?: { [key: string]: unknown }) => string;

type MyFunctionWithoutReturn = () => void;

describe('function-mock', () => {
  describe('createFunctionMock', () => {
    test('mocks with return', async () => {
      const context = { key: 'value' };

      const myFunctionMocks: FunctionMocks<MyFunction> = [
        { parameters: ['test', 0, 2], return: 'te' },
        { parameters: ['test', 1, 2], return: 'es' },
        { parameters: ['test', 2, 2, { key: 'value' }], return: 'st' },
        { parameters: ['test', 2, 2, context], return: 'st', strict: true },
      ];

      const myFunction = createFunctionMock(myFunctionMocks);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');
      expect(myFunction('test', 2, 2, { key: 'value' })).toBe('st');
      expect(myFunction('test', 2, 2, context)).toBe('st');

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });
  });

  test('mocks without return', async () => {
    const myFunctionMocks: FunctionMocks<MyFunctionWithoutReturn> = [{ parameters: [] }];

    const myFunction = createFunctionMock(myFunctionMocks);

    myFunction();

    // if you want to be sure, that all mocks are called
    expect(myFunctionMocks.length).toBe(0);
  });

  describe('useFunctionMock', () => {
    test('mocks with return', async () => {
      const context = { key: 'value' };

      const [myFunction, myFunctionMocks] = useFunctionMock<MyFunction>([
        { parameters: ['test', 0, 2], return: 'te' },
        { parameters: ['test', 1, 2], return: 'es' },
        { parameters: ['test', 2, 2, { key: 'value' }], return: 'st' },
        { parameters: ['test', 2, 2, context], return: 'st', strict: true },
      ]);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');
      expect(myFunction('test', 2, 2, { key: 'value' })).toBe('st');
      expect(myFunction('test', 2, 2, context)).toBe('st');

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('mocks with return or error', async () => {
      const error = new Error('test');

      const [myFunction, myFunctionMocks] = useFunctionMock<MyFunction>([
        { parameters: ['test', 0, 2], return: 'te' },
        { parameters: ['test', 1, 2], error },
      ]);

      expect(myFunction('test', 0, 2)).toBe('te');

      try {
        expect(myFunction('test', 1, 2)).toBe('es');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toBe(error);
      }

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('mocks with callback function', async () => {
      const [myFunction, myFunctionMocks] = useFunctionMock<MyFunction>([
        {
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(0);
            expect(stop).toBe(2);

            return 'te';
          },
        },
        {
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(1);
            expect(stop).toBe(2);

            return 'es';
          },
        },
      ]);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('mocks with function', async () => {
      const [myFunction, myFunctionMocks] = useFunctionMock<MyFunction>([
        (string: string, start: number, stop: number): string => {
          expect(string).toBe('test');
          expect(start).toBe(0);
          expect(stop).toBe(2);

          return 'te';
        },
        (string: string, start: number, stop: number): string => {
          expect(string).toBe('test');
          expect(start).toBe(1);
          expect(stop).toBe(2);

          return 'es';
        },
      ]);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('mocks with return or callback function', async () => {
      const [myFunction, myFunctionMocks] = useFunctionMock<MyFunction>([
        { parameters: ['test', 0, 2], return: 'te' },
        {
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(1);
            expect(stop).toBe(2);

            return 'es';
          },
        },
      ]);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('to less mocks', async () => {
      const [myFunction, myFunctionMocks] = useFunctionMock<MyFunction>([
        {
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(0);
            expect(stop).toBe(2);

            return 'te';
          },
        },
        (string: string, start: number, stop: number): string => {
          expect(string).toBe('test');
          expect(start).toBe(1);
          expect(stop).toBe(2);

          return 'es';
        },
        { parameters: ['test', 2, 2], return: 'st' },
      ]);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');
      expect(myFunction('test', 2, 2)).toBe('st');

      try {
        myFunction('test', 3, 1);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(/Missing mock: {"line":\d+,"mockIndex":3}/);
      }

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('parameters count mismatch', async () => {
      const [myFunction, myFunctionMocks] = useFunctionMock<MyFunction>([{ parameters: ['test', 0, 2], return: 'te' }]);

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        myFunction('test', 0);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(/Parameters count mismatch: {"line":\d+,"mockIndex":0,"actual":2,"expect":3}/);
      }

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('parameter mismatch', async () => {
      const [myFunction, myFunctionMocks] = useFunctionMock<MyFunction>([
        { parameters: ['test', 0, 2], return: 'te' },
        { parameters: ['test', 0, 2, { key: 'value1' }], return: 'te', strict: true },
        { parameters: ['test', 0, 2, { key: 'value1' }], return: 'te' },
      ]);

      try {
        myFunction('test', 0, 3);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(
          /Parameter mismatch: {"line":\d+,"mockIndex":0,"parameterIndex":2,"actual":3,"expect":2}/,
        );
      }

      try {
        expect(myFunction('test', 0, 2, { key: 'value1' })).toBe('te');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(
          /Parameter mismatch: {"line":\d+,"mockIndex":0,"parameterIndex":3,"actual":{"key":"value1"},"expect":{"key":"value1"},"strict":true}/,
        );
      }

      try {
        expect(myFunction('test', 0, 2, { key: 'value2' })).toBe('te');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(
          /Parameter mismatch: {"line":\d+,"mockIndex":0,"parameterIndex":3,"actual":{"key":"value2"},"expect":{"key":"value1"}}/,
        );
      }

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });
  });

  describe('internalResolveCallerLineFromStack', () => {
    test('with no stack', () => {
      expect(internalResolveCallerLineFromStack(undefined)).toBeUndefined();
    });

    describe('jest like', () => {
      test('with useFunctionMock', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
          at createFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.js:19:45)
          at useFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.js:107:42)
          at Object.useFunctionMock (/path/to/project/tests/unit/sample.test.ts:8:35)
          ...
        `),
        ).toBe(8);
      });

      test('with createFunctionMock', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
          at createFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.js:19:45)
          at Object.createFunctionMock (/path/to/project/tests/unit/sample.test.ts:8:35)
          ...
        `),
        ).toBe(8);
      });

      test('with anonymous', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
          at createFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.js:19:45)
          at useFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.js:107:42)
          at Object.<anonymous> (/path/to/project/tests/unit/sample.test.ts:8:35)
          ...
        `),
        ).toBe(8);
      });
    });

    describe('vitest like', () => {
      test('with useFunctionMock', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
            at createFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.ts:39:51)
            at Module.useFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.ts:125:11)
            at /path/to/project/tests/function-mock.test.ts:8:35
            at file:///path/to/project/node_modules/@vitest/runner/dist/index.js:135:14
          ...
        `),
        ).toBe(8);
      });

      test('with createFunctionMock', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
            at Module.createFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.ts:39:51)
            at /path/to/project/tests/function-mock.test.ts:8:35
            at file:///path/to/project/node_modules/@vitest/runner/dist/index.js:135:14
          ...
        `),
        ).toBe(8);
      });
    });

    test('with no match', () => {
      expect(
        internalResolveCallerLineFromStack(`
      Error:
        at createFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.js:19:45)
        at useFunctionMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/function-mock.js:107:42)
        ...
      `),
      ).toBeUndefined();
    });
  });
});
