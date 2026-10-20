import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'

import { PartsTable } from './PartsTable'

test('renders each warehouse offer with formatted price and shipment date', () => {
  render(
    <PartsTable
      parts={[
        {
          goodsID: 'part-1',
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
          ],
        },
      ]}
    />,
  )

  const table = screen.getByRole('table', {
    name: 'Предложения по запчастям',
  })
  const row = within(table).getAllByRole('row')[1]

  expect(row).toHaveTextContent('Рычаг подвески')
  expect(row).toHaveTextContent('MEYLE')
  expect(row).toHaveTextContent('7160500039S')
  expect(row).toHaveTextContent('Оригинал')
  expect(row).toHaveTextContent('МС2')
  expect(row).toHaveTextContent('1 200,50 ₽')
  expect(row).toHaveTextContent('3')
  expect(row).toHaveTextContent('21.10.2026')
})

test('renders an unavailable part without a warehouse, price, or date', () => {
  render(
    <PartsTable
      parts={[
        {
          goodsID: 'part-2',
          name: 'Свеча зажигания',
          brand: 'NGK',
          number: '1234',
          isAnalogue: true,
          offers: [
            {
              warehouse: null,
              price: null,
              stock: 0,
              shipmentDate: null,
            },
          ],
        },
      ]}
    />,
  )

  const row = screen.getAllByRole('row')[1]

  expect(row).toHaveTextContent('Аналог')
  expect(row).toHaveTextContent('Нет предложений')
  expect(row).toHaveTextContent('—')
  expect(row).toHaveTextContent('0')
})

test('uses a placeholder for an invalid shipment date', () => {
  render(
    <PartsTable
      parts={[
        {
          goodsID: 'part-3',
          name: 'Фильтр',
          brand: 'MANN',
          number: 'W 914/2',
          isAnalogue: false,
          offers: [
            {
              warehouse: { id: 'warehouse-3', code: 'СПБ', own: false },
              price: 500,
              stock: 1,
              shipmentDate: 'not-a-date',
            },
          ],
        },
      ]}
    />,
  )

  expect(screen.getAllByRole('row')[1]).toHaveTextContent('—')
})
