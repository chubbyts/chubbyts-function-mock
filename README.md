# chubbyts-function-mock

[![CI](https://github.com/chubbyts/chubbyts-function-mock/workflows/CI/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-function-mock/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-function-mock/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-function-mock?branch=master)
[![Infection MSI](https://badge.stryker-mutator.io/github.com/chubbyts/chubbyts-function-mock/master)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-function-mock/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-function-mock.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-function-mock)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-function-mock&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-function-mock)

## Description

A function mock helper.

**IMPORTANT**: `deepStrictEqual` is used for parameter comparsion, `===` if you pass `strict: true`

## Requirements

 * node: 16

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-function-mock][1].

```sh
npm i @chubbyts/chubbyts-function-mock@1.3.0
```

## Usage

### createFunctionMock

```ts
import { expect, test } from '@jest/globals';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';

type MyFunction = (string: string, start: number, stop: number) => string;

test('my random test', () => {
  const [myFunction, myFunctionUnusedMocks] = useFunctionMock<MyFunction>([
    { parameters: ['test', 0, 2], return: 'te' },
    {
      callback: (string: string, start: number, stop: number): string => {
        expect(string).toBe('test');
        expect(start).toBe(1);
        expect(stop).toBe(2);

        return 'es';
      }
    },
    { parameters: ['test', 0, 2], error: new Error('test') },
  ]);

  expect(myFunction('test', 0, 2)).toBe('te');
  expect(myFunction('test', 1, 2)).toBe('es');

  try {
    expect(myFunction('test', 2, 2)).toBe('st');
    throw new Error('Expect fail');
  } catch (e) {
    expect(e).toMatchInlineSnapshot('[Error: test]');
  }

  // if you want to be sure, that all mocks are called
  expect(myFunctionUnusedMocks.length).toBe(0);
});
```

### createObjectMock

```ts
import { expect, test } from '@jest/globals';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';

type MyType = {
  substring: (string: string, start: number, stop: number) => string;
  uppercase: (string: string) => string;
};

test('my random test', () => {
  const [myObject, myObjectUnusedMocks] = useObjectMock<MyType>([
    { name: 'substring', parameters: ['test', 0, 2], return: 'te' },
    {
      name: 'substring',
      callback: (string: string, start: number, stop: number): string => {
        expect(string).toBe('test');
        expect(start).toBe(1);
        expect(stop).toBe(2);

        return 'es';
      }
    },
    { name: 'uppercase', parameters: ['test'], error: new Error('test') },
  ]);

  expect(myObject.substring('test', 0, 2)).toBe('te');
  expect(myObject.substring('test', 1, 2)).toBe('es');

  try {
    expect(myObject.uppercase('test')).toBe('st');
    throw new Error('Expect fail');
  } catch (e) {
    expect(e).toMatchInlineSnapshot('[Error: test]');
  }

  // if you want to be sure, that all mocks are called
  expect(myObjectUnusedMocks.length).toBe(0);
});
```

## Copyright

2023 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-function-mock
