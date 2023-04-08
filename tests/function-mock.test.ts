import { describe, expect, test } from '@jest/globals';
import type { FunctionMocks } from '../src/function-mock';
import { createFunctionMock } from '../src/function-mock';

type MyFunction = (string: string, start: number, stop: number) => string;

describe('function-mock', () => {
  describe('createFunctionMock', () => {
    test('mocks with return', async () => {
      const myFunctionMocks: FunctionMocks<MyFunction> = [
        { parameters: ['test', 0, 2], return: 'te' },
        { parameters: ['test', 1, 2], return: 'es' },
      ];

      const myFunction = createFunctionMock(myFunctionMocks);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('mocks with return or error', async () => {
      const myFunctionMocks: FunctionMocks<MyFunction> = [
        { parameters: ['test', 0, 2], return: 'te' },
        { parameters: ['test', 1, 2], error: new Error('test') },
      ];

      const myFunction = createFunctionMock(myFunctionMocks);

      expect(myFunction('test', 0, 2)).toBe('te');

      try {
        expect(myFunction('test', 1, 2)).toBe('es');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot('[Error: test]');
      }

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('mocks with callback function', async () => {
      const myFunctionMocks: FunctionMocks<MyFunction> = [
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
      ];

      const myFunction = createFunctionMock(myFunctionMocks);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('mocks with function', async () => {
      const myFunctionMocks: FunctionMocks<MyFunction> = [
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
      ];

      const myFunction = createFunctionMock(myFunctionMocks);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('mocks with return or callback function', async () => {
      const myFunctionMocks: FunctionMocks<MyFunction> = [
        { parameters: ['test', 0, 2], return: 'te' },
        {
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(1);
            expect(stop).toBe(2);

            return 'es';
          },
        },
      ];

      const myFunction = createFunctionMock(myFunctionMocks);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('to less mocks', async () => {
      const myFunctionMocks: FunctionMocks<MyFunction> = [
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
      ];

      const myFunction = createFunctionMock(myFunctionMocks);

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');
      expect(myFunction('test', 2, 2)).toBe('st');

      try {
        expect(myFunction('test', 3, 1)).toBe('t');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Missing mock: {
            "line": "147",
            "mockIndex": 3
          }]
        `);
      }

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('parameters count mismatch', async () => {
      const myFunctionMocks: FunctionMocks<MyFunction> = [{ parameters: ['test', 0, 2], return: 'te' }];

      const myFunction = createFunctionMock(myFunctionMocks);

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(myFunction('test', 0)).toBe('te');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Parameters count mismatch: {
            "line": "172",
            "mockIndex": 0,
            "actual": 2,
            "expect": 3
          }]
        `);
      }

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });

    test('parameter mismatch', async () => {
      const myFunctionMocks: FunctionMocks<MyFunction> = [{ parameters: ['test', 0, 2], return: 'te' }];

      const myFunction = createFunctionMock(myFunctionMocks);

      try {
        expect(myFunction('test', 0, 3)).toBe('te');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Parameter mismatch: {
            "line": "197",
            "mockIndex": 0,
            "parameterIndex": 2,
            "actual": 3,
            "expect": 2
          }]
        `);
      }

      // if you want to be sure, that all mocks are called
      expect(myFunctionMocks.length).toBe(0);
    });
  });
});
