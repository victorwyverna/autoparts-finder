import { expect, test } from 'vitest'

import * as part from '../index'

test('exposes only the supported part normalization interface', () => {
  expect(Object.keys(part).sort()).toEqual([
    'PartsTable',
    'getManufacturerOptions',
    'normalizeParts',
  ])
})

test('returns unique manufacturer options with the exact API number', () => {
  const goods = [
    { brand: 'MANN-FILTER', number: 'HU 719/7 X' },
    { brand: 'MANN-FILTER', number: 'HU 719/7 X' },
    { brand: 'MANN-FILTER', number: 'HU719/7X' },
    { brand: 'Bosch', number: '1 457 429 192' },
    {},
    { brand: '', number: 'ABC' },
    { brand: 'NGK' },
    null,
  ]

  expect(part.getManufacturerOptions(goods)).toEqual([
    { brand: 'MANN-FILTER', number: 'HU 719/7 X' },
    { brand: 'MANN-FILTER', number: 'HU719/7X' },
    { brand: 'Bosch', number: '1 457 429 192' },
  ])
})

test('keeps distinct manufacturer pairs when their values contain delimiters', () => {
  const goods = [
    { brand: 'A', number: 'B\u0000C' },
    { brand: 'A\u0000B', number: 'C' },
  ]

  expect(part.getManufacturerOptions(goods)).toEqual([
    { brand: 'A', number: 'B\u0000C' },
    { brand: 'A\u0000B', number: 'C' },
  ])
})

test('normalizes source parts, analogues, and every warehouse offer', () => {
  const goods = [
    {
      goodsID: 'source-1',
      brand: 'MEYLE',
      number: '7160500039S',
      name: 'Рычаг подвески',
      count: 8,
      price: 99999,
      rate: 1,
      warehouses: [
        {
          id: 'warehouse-1',
          code: 'МС2',
          own: true,
          shipmentDate: '2026-10-21T18:00:00',
          price: 1200.5,
          stock: 3,
        },
        {
          id: 'warehouse-2',
          own: false,
          shipmentDate: '2026-10-22T14:00:00',
          price: 1250,
          stock: 5,
        },
      ],
      analogues: [
        {
          goodsID: 'source-1',
          brand: 'FEBI',
          number: '01234',
          name: 'Рычаг подвески аналог',
          price: 77777,
          warehouses: [
            {
              id: 'warehouse-3',
              code: 'СПБ',
              own: false,
              shipmentDate: '2026-10-23T12:00:00',
              price: 980,
              stock: 2,
            },
          ],
        },
      ],
    },
  ]

  expect(part.normalizeParts(goods)).toEqual([
    {
      goodsID: 'source-1',
      name: 'Рычаг подвески',
      brand: 'MEYLE',
      number: '7160500039S',
      isAnalogue: false,
      offers: [
        {
          warehouse: { id: 'warehouse-1', code: 'МС2', own: true },
          price: 1200.5,
          stock: 3,
          shipmentDate: '2026-10-21T18:00:00',
        },
        {
          warehouse: { id: 'warehouse-2', code: null, own: false },
          price: 1250,
          stock: 5,
          shipmentDate: '2026-10-22T14:00:00',
        },
      ],
    },
    {
      goodsID: 'source-1',
      name: 'Рычаг подвески аналог',
      brand: 'FEBI',
      number: '01234',
      isAnalogue: true,
      offers: [
        {
          warehouse: { id: 'warehouse-3', code: 'СПБ', own: false },
          price: 980,
          stock: 2,
          shipmentDate: '2026-10-23T12:00:00',
        },
      ],
    },
  ])
})

test('represents a valid part without warehouses as unavailable', () => {
  const goods = [
    {
      goodsID: 'part-1',
      name: 'Свеча зажигания',
      brand: 'NGK',
      number: '1234',
      price: 450,
      count: 0,
    },
  ]

  expect(part.normalizeParts(goods)).toEqual([
    {
      goodsID: 'part-1',
      name: 'Свеча зажигания',
      brand: 'NGK',
      number: '1234',
      isAnalogue: false,
      offers: [
        {
          warehouse: null,
          price: null,
          stock: 0,
          shipmentDate: null,
        },
      ],
    },
  ])
})

test('filters malformed data and merges exact duplicate parts and offers', () => {
  const goods = [
    {},
    null,
    {
      goodsID: 'part-1',
      name: 'Фильтр',
      brand: 'MANN',
      number: 'W 914/2',
      warehouses: [
        {
          id: 'warehouse-1',
          code: 'МС2',
          own: true,
          shipmentDate: '2026-10-21T18:00:00',
          price: 500,
          stock: 4,
        },
        {},
        null,
      ],
      analogues: [{ goodsID: 'broken-analogue' }],
    },
    {
      goodsID: 'part-1',
      name: 'Фильтр',
      brand: 'MANN',
      number: 'W 914/2',
      warehouses: [
        {
          id: 'warehouse-1',
          code: 'МС2',
          own: true,
          shipmentDate: '2026-10-21T18:00:00',
          price: 500,
          stock: 4,
        },
      ],
    },
    { goodsID: 'broken-part', brand: 'MANN', number: 'BROKEN' },
  ]
  const original = structuredClone(goods)

  expect(part.normalizeParts(goods)).toEqual([
    {
      goodsID: 'part-1',
      name: 'Фильтр',
      brand: 'MANN',
      number: 'W 914/2',
      isAnalogue: false,
      offers: [
        {
          warehouse: { id: 'warehouse-1', code: 'МС2', own: true },
          price: 500,
          stock: 4,
          shipmentDate: '2026-10-21T18:00:00',
        },
      ],
    },
  ])
  expect(goods).toEqual(original)
})

test('does not attach offers from a conflicting duplicate goodsID', () => {
  const goods = [
    {
      goodsID: 'part-1',
      name: 'Первый фильтр',
      brand: 'MANN',
      number: 'W 914/2',
      warehouses: [{ id: 'warehouse-1', price: 500, stock: 4 }],
    },
    {
      goodsID: 'part-1',
      name: 'Другая деталь',
      brand: 'BOSCH',
      number: 'P 3274',
      warehouses: [{ id: 'warehouse-2', price: 900, stock: 2 }],
    },
  ]

  expect(part.normalizeParts(goods)).toEqual([
    {
      goodsID: 'part-1',
      name: 'Первый фильтр',
      brand: 'MANN',
      number: 'W 914/2',
      isAnalogue: false,
      offers: [
        {
          warehouse: { id: 'warehouse-1', code: null, own: null },
          price: 500,
          stock: 4,
          shipmentDate: null,
        },
      ],
    },
  ])
})

test('handles missing goods arrays', () => {
  expect(part.getManufacturerOptions()).toEqual([])
  expect(part.getManufacturerOptions({})).toEqual([])
  expect(part.normalizeParts()).toEqual([])
  expect(part.normalizeParts({})).toEqual([])
})
