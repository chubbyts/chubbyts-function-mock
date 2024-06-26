import { describe, expect, test } from 'vitest';
import type { ObjectMocks } from '../src/object-mock';
import { internalResolveCallerLineFromStack, createObjectMock, useObjectMock } from '../src/object-mock';

type MyType = {
  substring: (string: string, start: number, stop: number, context?: { [key: string]: unknown }) => string;
  uppercase: (string: string) => string;
  doesNothing: () => void;
  self: () => MyType;
  type: string;
};

interface MyInterface {
  substring: (string: string, start: number, stop: number, context?: { [key: string]: unknown }) => string;
  uppercase: (string: string) => string;
  doesNothing: () => void;
  self: () => MyType;
  type: string;
}

describe('object-mock', () => {
  describe('createObjectMock', () => {
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
  });

  describe('useObjectMock', () => {
    test('mocks with value', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
        { name: 'type', value: 'value1' },
        { name: 'type', value: 'value2' },
      ]);

      expect(myObject.type).toBe('value1');
      expect(myObject.type).toBe('value2');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with return', async () => {
      const context = { key: 'value' };

      const [myObject, myObjectMocks] = useObjectMock<MyType>([
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'substring', parameters: ['test', 1, 2], return: 'es' },
        { name: 'substring', parameters: ['test', 2, 2, { key: 'value' }], return: 'st' },
        { name: 'substring', parameters: ['test', 2, 2, context], return: 'st', strict: true },
      ]);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');
      expect(myObject.substring('test', 2, 2, { key: 'value' })).toBe('st');
      expect(myObject.substring('test', 2, 2, context)).toBe('st');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('use mock within Promise.resolve', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
      ]);

      const blub = await Promise.resolve(myObject);

      expect(blub.substring('test', 0, 2)).toBe('te');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('use mock within Promise.reject', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
      ]);

      try {
        await Promise.reject(myObject);
        throw new Error('Expect fail');
      } catch (e) {
        expect((e as MyType).substring('test', 0, 2)).toBe('te');
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with interface', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyInterface>([
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'substring', parameters: ['test', 1, 2], return: 'es' },
      ]);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with returnSelf', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
        { name: 'self', parameters: [], returnSelf: true },
        { name: 'self', parameters: [], returnSelf: true },
      ]);

      expect(myObject.self()).toBe(myObject);
      expect(myObject.self()).toBe(myObject);

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with return or error', async () => {
      const error = new Error('test');

      const [myObject, myObjectMocks] = useObjectMock<MyType>([
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'substring', parameters: ['test', 1, 2], error },
      ]);

      expect(myObject.substring('test', 0, 2)).toBe('te');

      try {
        expect(myObject.substring('test', 1, 2)).toBe('es');
        throw new Error('Expect fail');
      } catch (e) {
        expect(e).toBe(error);
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with callback function', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
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
      ]);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with return or callback function', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
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
      ]);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('mocks with return and different methods', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'uppercase', parameters: ['test'], return: 'TEST' },
        { name: 'doesNothing', parameters: [] },
        { name: 'substring', parameters: ['test', 1, 2], return: 'es' },
        { name: 'uppercase', parameters: ['test'], return: 'TEST' },
        { name: 'doesNothing', parameters: [] },
      ]);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.uppercase('test')).toBe('TEST');
      myObject.doesNothing();
      expect(myObject.substring('test', 1, 2)).toBe('es');
      expect(myObject.uppercase('test')).toBe('TEST');
      myObject.doesNothing();

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('to less mocks', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
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
      ]);

      expect(myObject.substring('test', 0, 2)).toBe('te');
      expect(myObject.substring('test', 1, 2)).toBe('es');

      try {
        myObject.substring('test', 2, 2);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(/Missing mock: {"line":\d+,"mockIndex":2}/);
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('method name mismatch', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
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
      ]);

      expect(myObject.type).toBe('value1');
      expect(myObject.substring('test', 0, 2)).toBe('te');

      try {
        myObject.substring('test', 1, 2);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(
          /Method name mismatch: {"line":\d+,"mockIndex":2,"actual":"substring","expect":"uppercase"}/,
        );
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('parameters count mismatch', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
      ]);

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        myObject.substring('test', 0);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(
          /Parameters count mismatch: {"line":\d+,"mockIndex":0,"name":"substring","actual":2,"expect":3}/,
        );
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });

    test('parameter mismatch', async () => {
      const [myObject, myObjectMocks] = useObjectMock<MyType>([
        { name: 'self', parameters: [], returnSelf: true },
        { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
        { name: 'substring', parameters: ['test', 0, 2, { key: 'value1' }], return: 'te', strict: true },
        { name: 'substring', parameters: ['test', 0, 2, { key: 'value1' }], return: 'te' },
      ]);

      expect(myObject.self()).toBe(myObject);

      try {
        myObject.substring('test', 0, 3);
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(
          /Parameter mismatch: {"line":\d+,"mockIndex":1,"name":"substring","parameterIndex":2,"actual":3,"expect":2}/,
        );
      }

      try {
        myObject.substring('test', 0, 2, { key: 'value1' });
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(
          /Parameter mismatch: {"line":\d+,"mockIndex":1,"name":"substring","parameterIndex":3,"actual":{"key":"value1"},"expect":{"key":"value1"},"strict":true}/,
        );
      }

      try {
        myObject.substring('test', 0, 2, { key: 'value2' });
        throw new Error('Expect fail');
      } catch (e) {
        expect(e.message).toMatch(
          /Parameter mismatch: {"line":\d+,"mockIndex":1,"name":"substring","parameterIndex":3,"actual":{"key":"value2"},"expect":{"key":"value1"}}/,
        );
      }

      // if you want to be sure, that all mocks are called
      expect(myObjectMocks.length).toBe(0);
    });
  });

  describe('internalResolveCallerLineFromStack', () => {
    test('with no stack', () => {
      expect(internalResolveCallerLineFromStack(undefined)).toBeUndefined();
    });

    describe('jest like', () => {
      test('with useObjectMock', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
          at createObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.js:19:45)
          at useObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.js:107:42)
          at Object.useObjectMock (/path/to/project/tests/unit/sample.test.ts:8:35)
          ...
        `),
        ).toBe(8);
      });

      test('with createObjectMock', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
          at createObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.js:19:45)
          at Object.createObjectMock (/path/to/project/tests/unit/sample.test.ts:8:35)
          ...
        `),
        ).toBe(8);
      });

      test('with anonymous', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
          at createObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.js:19:45)
          at useObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.js:107:42)
          at Object.<anonymous> (/path/to/project/tests/unit/sample.test.ts:8:35)
          ...
        `),
        ).toBe(8);
      });
    });

    describe('vitest like', () => {
      test('with useObjectMock', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
            at createObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.ts:39:51)
            at Module.useObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.ts:125:11)
            at /path/to/project/tests/function-mock.test.ts:8:35
            at file:///path/to/project/node_modules/@vitest/runner/dist/index.js:135:14
          ...
        `),
        ).toBe(8);
      });

      test('with createObjectMock', () => {
        expect(
          internalResolveCallerLineFromStack(`
        Error:
            at Module.createObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.ts:39:51)
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
        at createObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.js:19:45)
        at useObjectMock (/path/to/project/node_modules/@chubbyts/chubbyts-function-mock/dist/object-mock.js:107:42)
        ...
      `),
      ).toBeUndefined();
    });
  });
});
