import { describe, expect, test } from '@jest/globals';
import { createFunctionMock } from '../src/function-mock';

type MyFunction = (string: string, start: number, stop: number) => string;

describe('function-mock', () => {
  describe('createFunctionMock', () => {
    test('mocks are {parameters: ..., return: ... }', async () => {
      const myFunction = jest.fn(
        createFunctionMock<MyFunction>([
          { parameters: ['test', 0, 2], return: 'te' },
          { parameters: ['test', 1, 2], return: 'es' },
        ]),
      );

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      expect(myFunction).toBeCalledTimes(2);
    });

    test('mocks are functions', async () => {
      const myFunction = jest.fn(
        createFunctionMock<MyFunction>([
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
        ]),
      );

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      expect(myFunction).toBeCalledTimes(2);
    });

    test('mocks are {parameters: ..., return: ... } or functions', async () => {
      const myFunction = jest.fn(
        createFunctionMock<MyFunction>([
          { parameters: ['test', 0, 2], return: 'te' },
          (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(1);
            expect(stop).toBe(2);

            return 'es';
          },
        ]),
      );

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      expect(myFunction).toBeCalledTimes(2);
    });

    test('to less mocks', async () => {
      const myFunction = jest.fn(
        createFunctionMock<MyFunction>([
          (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(0);
            expect(stop).toBe(2);

            return 'te';
          },
          { parameters: ['test', 1, 2], return: 'es' },
        ]),
      );

      expect(myFunction('test', 0, 2)).toBe('te');
      expect(myFunction('test', 1, 2)).toBe('es');

      try {
        expect(myFunction('test', 2, 2)).toBe('st');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Missing mock: {
            "line": "70",
            "mockIndex": 2
          }]
        `);
      }

      expect(myFunction).toBeCalledTimes(3);
    });

    test('invalid parameter count', async () => {
      const myFunction = jest.fn(createFunctionMock<MyFunction>([{ parameters: ['test', 0, 2], return: 'te' }]));

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(myFunction('test', 0)).toBe('te');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Parameters count mismatch: {
            "line": "101",
            "mockIndex": 0,
            "actual": 2,
            "expect": 3
          }]
        `);
      }

      expect(myFunction).toBeCalledTimes(1);
    });

    test('invalid parameter', async () => {
      const myFunction = jest.fn(createFunctionMock<MyFunction>([{ parameters: ['test', 0, 2], return: 'te' }]));

      try {
        expect(myFunction('test', 0, 3)).toBe('te');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Parameter mismatch: {
            "line": "123",
            "mockIndex": 0,
            "parameterIndex": 2,
            "actual": 3,
            "expect": 2
          }]
        `);
      }

      expect(myFunction).toBeCalledTimes(1);
    });
  });
});
