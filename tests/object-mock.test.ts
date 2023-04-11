import { describe, expect, test } from '@jest/globals';
import type { ObjectMocks } from '../src/object-mock';
import { createObjectMock } from '../src/object-mock';

type MyType = {
  substring: (string: string, start: number, stop: number, context?: { [key: string]: unknown }) => string;
  uppercase: (string: string) => string;
  self: () => MyType;
  type: string;
};

interface MyInterface {
  substring: (string: string, start: number, stop: number, context?: { [key: string]: unknown }) => string;
  uppercase: (string: string) => string;
  self: () => MyType;
  type: string;
}

describe('object-mock', () => {
  describe('createFunctionMock', () => {
    test('mocks with value', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [
        { name: 'type', value: 'value1' },
        { name: 'type', value: 'value2' },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.type).toBe('value1');
      expect(myObject.type).toBe('value2');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with return', async () => {
      const context = { key: 'value' };

      const myObjectMocks: ObjectMocks<MyType> = [
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'substring', parameters: ['test', 1, 2], return: 'es' },
        { name: 'substring', parameters: ['test', 2, 2, { key: 'value' }], return: 'st' },
        { name: 'substring', parameters: ['test', 2, 2, context], return: 'st', strict: true },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');
      expect(myObject.substring('test', 2, 2, { key: 'value' })).toBe('st');
      expect(myObject.substring('test', 2, 2, context)).toBe('st');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('use mock within promise', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [{ name: 'substring', parameters: ['test', 0, 2], return: 'te' }];

      const myObject = createObjectMock(myObjectMocks);

      const blub = await Promise.resolve(myObject);

      expect(blub.substring('test', 0, 2)).toBe('te');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with interface', async () => {
      const myObjectMocks: ObjectMocks<MyInterface> = [
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'substring', parameters: ['test', 1, 2], return: 'es' },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with returnSelf', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [
        { name: 'self', parameters: [], returnSelf: true },
        { name: 'self', parameters: [], returnSelf: true },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.self()).toBe(myObject);
      expect(myObject.self()).toBe(myObject);

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with return or error', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'substring', parameters: ['test', 1, 2], error: new Error('test') },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.substring('test', 0, 2)).toBe('te');

      try {
        expect(myObject.substring('test', 1, 2)).toBe('es');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot('[Error: test]');
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with callback function', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [
        {
          name: 'substring',
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(0);
            expect(stop).toBe(2);

            return 'te';
          },
        },
        {
          name: 'substring',
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(1);
            expect(stop).toBe(2);

            return 'es';
          },
        },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with return or callback function', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        {
          name: 'substring',
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(1);
            expect(stop).toBe(2);

            return 'es';
          },
        },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with return and different methods', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'uppercase', parameters: ['test'], return: 'TEST' },
        { name: 'substring', parameters: ['test', 1, 2], return: 'es' },
        { name: 'uppercase', parameters: ['test'], return: 'TEST' },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.uppercase('test')).toBe('TEST');
      expect(myObject.substring('test', 1, 2)).toBe('es');
      expect(myObject.uppercase('test')).toBe('TEST');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('to less mocks', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [
        {
          name: 'substring',
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(0);
            expect(stop).toBe(2);

            return 'te';
          },
        },
        { name: 'substring', parameters: ['test', 1, 2], return: 'es' },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');

      try {
        myObject.substring('test', 2, 2);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Missing mock: {
            "line": "212",
            "mockIndex": 2
          }]
        `);
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('method name mismatch', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [
        { name: 'type', value: 'value1' },
        {
          name: 'substring',
          callback: (string: string, start: number, stop: number): string => {
            expect(string).toBe('test');
            expect(start).toBe(0);
            expect(stop).toBe(2);

            return 'te';
          },
        },
        { name: 'uppercase', parameters: ['test'], return: 'TEST' },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.type).toBe('value1');
      expect(myObject.substring('test', 0, 2)).toBe('te');

      try {
        myObject.substring('test', 1, 2);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Method name mismatch: {
            "line": "249",
            "mockIndex": 2,
            "actual": "substring",
            "expect": "uppercase"
          }]
        `);
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('parameters count mismatch', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [{ name: 'substring', parameters: ['test', 0, 2], return: 'te' }];

      const myObject = createObjectMock(myObjectMocks);

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        myObject.substring('test', 0);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Parameters count mismatch: {
            "line": "275",
            "mockIndex": 0,
            "name": "substring",
            "actual": 2,
            "expect": 3
          }]
        `);
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('parameter mismatch', async () => {
      const myObjectMocks: ObjectMocks<MyType> = [
        { name: 'self', parameters: [], returnSelf: true },
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'substring', parameters: ['test', 0, 2, { key: 'value1' }], return: 'te', strict: true },
        { name: 'substring', parameters: ['test', 0, 2, { key: 'value1' }], return: 'te' },
      ];

      const myObject = createObjectMock(myObjectMocks);

      expect(myObject.self()).toBe(myObject);

      try {
        myObject.substring('test', 0, 3);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Parameter mismatch: {
            "line": "306",
            "mockIndex": 1,
            "name": "substring",
            "parameterIndex": 2,
            "actual": 3,
            "expect": 2
          }]
        `);
      }

      try {
        myObject.substring('test', 0, 2, { key: 'value1' });
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Parameter mismatch: {
            "line": "306",
            "mockIndex": 1,
            "name": "substring",
            "parameterIndex": 3,
            "actual": {
              "key": "value1"
            },
            "expect": {
              "key": "value1"
            }
          }]
        `);
      }

      try {
        myObject.substring('test', 0, 2, { key: 'value2' });
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [Error: Parameter mismatch: {
            "line": "306",
            "mockIndex": 1,
            "name": "substring",
            "parameterIndex": 3,
            "actual": {
              "key": "value2"
            },
            "expect": {
              "key": "value1"
            }
          }]
        `);
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });
  });
});
