import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { beforeEach, expect, test, vi } from 'vitest'

import { searchAnalogues, searchParts } from '../../../shared/api'
import { partSearchReducer } from '../model/partSearchSlice'
import { PartSearch } from './PartSearch'

vi.mock('../../../shared/api', () => ({
  searchAnalogues: vi.fn(),
  searchParts: vi.fn(),
}))

const searchPartsMock = vi.mocked(searchParts)
const searchAnaloguesMock = vi.mocked(searchAnalogues)

function renderSearch() {
  const store = configureStore({
    reducer: { partSearch: partSearchReducer },
  })

  return {
    user: userEvent.setup(),
    store,
    ...render(
      <Provider store={store}>
        <PartSearch />
      </Provider>,
    ),
  }
}

function rawPart({
  goodsID = 'part-1',
  brand = 'MANN',
  number = 'W 914/2',
  name = 'Масляный фильтр',
  warehouses = [
    {
      id: 'warehouse-1',
      code: 'МС2',
      own: true,
      price: 500,
      stock: 4,
      shipmentDate: '2026-10-21T18:00:00',
    },
  ],
  analogues = [],
} = {}) {
  return { goodsID, brand, number, name, warehouses, analogues }
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('searches an article, selects its exact manufacturer, and shows offers', async () => {
  searchPartsMock.mockResolvedValue([
    rawPart(),
    rawPart({ goodsID: 'part-2', brand: 'BOSCH', number: '0 451 103 336' }),
  ])
  searchAnaloguesMock.mockResolvedValue([
    rawPart({
      analogues: [
        rawPart({
          goodsID: 'analogue-1',
          brand: 'FILTRON',
          number: 'OP 520/1',
          name: 'Фильтр-аналог',
        }),
      ],
    }),
  ])
  const { user } = renderSearch()

  await user.type(screen.getByLabelText('Артикул детали'), ' W9142 ')
  await user.click(screen.getByRole('button', { name: 'Найти' }))

  const manufacturerGroup = await screen.findByRole('group', {
    name: 'Выберите производителя',
  })
  expect(within(manufacturerGroup).getByRole('button', { name: /MANN/ })).toHaveTextContent(
    'W 914/2',
  )

  await user.click(within(manufacturerGroup).getByRole('button', { name: /MANN/ }))

  const table = await screen.findByRole('table', {
    name: 'Предложения по запчастям',
  })
  expect(within(table).getByText('Масляный фильтр')).toBeInTheDocument()
  expect(within(table).getByText('Фильтр-аналог')).toBeInTheDocument()
  expect(
    screen.getByRole('region', { name: 'Найденные предложения' }),
  ).toHaveAttribute('aria-live', 'polite')
  expect(
    within(manufacturerGroup).getByRole('button', { name: /MANN/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(
    within(manufacturerGroup).getByRole('button', { name: /BOSCH/ }),
  ).toHaveAttribute('aria-pressed', 'false')
  expect(
    within(manufacturerGroup).getByRole('button', { name: /MANN/ }),
  ).toHaveClass('active')
  expect(searchPartsMock).toHaveBeenCalledWith('W9142')
  expect(searchAnaloguesMock).toHaveBeenCalledWith({
    brand: 'MANN',
    number: 'W 914/2',
  })
})

test('shows validation and does not search a blank article', async () => {
  const { user } = renderSearch()

  await user.type(screen.getByLabelText('Артикул детали'), '   ')
  await user.click(screen.getByRole('button', { name: 'Найти' }))

  expect(screen.getByText('Введите артикул детали')).toBeInTheDocument()
  expect(searchPartsMock).not.toHaveBeenCalled()
})

test('shows an accessible manufacturer loader and prevents a repeated submit', async () => {
  const pendingSearch = deferred()
  searchPartsMock.mockReturnValue(pendingSearch.promise)
  const { user } = renderSearch()

  await user.type(screen.getByLabelText('Артикул детали'), 'W9142')
  await user.click(screen.getByRole('button', { name: 'Найти' }))

  expect(screen.getByRole('status')).toHaveTextContent(
    'Ищем производителей…',
  )
  const submitButton = screen.getByRole('button', { name: 'Найти' })
  expect(submitButton).toBeDisabled()
  await user.click(submitButton)
  expect(searchPartsMock).toHaveBeenCalledOnce()

  pendingSearch.resolve([])
  await waitFor(() => expect(submitButton).toBeEnabled())
})

test('shows a distinct error when manufacturer search fails', async () => {
  searchPartsMock.mockRejectedValue(new Error('API unavailable'))
  const { user } = renderSearch()

  await user.type(screen.getByLabelText('Артикул детали'), 'W9142')
  await user.click(screen.getByRole('button', { name: 'Найти' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Не удалось найти производителей. Попробуйте ещё раз.',
  )
})

test('explains when no manufacturers match the article', async () => {
  searchPartsMock.mockResolvedValue([])
  const { user } = renderSearch()

  await user.type(screen.getByLabelText('Артикул детали'), 'UNKNOWN')
  await user.click(screen.getByRole('button', { name: 'Найти' }))

  const emptyState = await screen.findByText(
    'Производители для этого артикула не найдены.',
  )
  expect(emptyState).toHaveAttribute('role', 'status')
  expect(screen.queryByRole('group')).not.toBeInTheDocument()
})

test('shows an accessible offers loader and disables manufacturer choices', async () => {
  searchPartsMock.mockResolvedValue([rawPart()])
  const pendingOffers = deferred()
  searchAnaloguesMock.mockReturnValue(pendingOffers.promise)
  const { user } = renderSearch()

  await user.type(screen.getByLabelText('Артикул детали'), 'W9142')
  await user.click(screen.getByRole('button', { name: 'Найти' }))
  const manufacturerButton = await screen.findByRole('button', { name: /MANN/ })
  await user.click(manufacturerButton)

  expect(screen.getByRole('status')).toHaveTextContent('Ищем предложения…')
  expect(manufacturerButton).toBeDisabled()

  pendingOffers.resolve([])
  await waitFor(() => expect(manufacturerButton).toBeEnabled())
})

test('shows a distinct error when offers search fails', async () => {
  searchPartsMock.mockResolvedValue([rawPart()])
  searchAnaloguesMock.mockRejectedValue(new Error('Offers unavailable'))
  const { user } = renderSearch()

  await user.type(screen.getByLabelText('Артикул детали'), 'W9142')
  await user.click(screen.getByRole('button', { name: 'Найти' }))
  await user.click(await screen.findByRole('button', { name: /MANN/ }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Не удалось загрузить предложения. Попробуйте ещё раз.',
  )
})

test('explains when the selected manufacturer has no offers', async () => {
  searchPartsMock.mockResolvedValue([rawPart()])
  searchAnaloguesMock.mockResolvedValue([])
  const { user } = renderSearch()

  await user.type(screen.getByLabelText('Артикул детали'), 'W9142')
  await user.click(screen.getByRole('button', { name: 'Найти' }))
  await user.click(await screen.findByRole('button', { name: /MANN/ }))

  const emptyState = await screen.findByText(
    'Предложения для выбранной детали не найдены.',
  )
  expect(emptyState).toHaveAttribute('role', 'status')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

test('removes previous offers as soon as a new article search starts', async () => {
  const nextSearch = deferred()
  searchPartsMock
    .mockResolvedValueOnce([rawPart()])
    .mockReturnValueOnce(nextSearch.promise)
  searchAnaloguesMock.mockResolvedValue([rawPart()])
  const { user } = renderSearch()
  const input = screen.getByLabelText('Артикул детали')

  await user.type(input, 'W9142')
  await user.click(screen.getByRole('button', { name: 'Найти' }))
  await user.click(await screen.findByRole('button', { name: /MANN/ }))
  expect(await screen.findByRole('table')).toBeInTheDocument()

  await user.clear(input)
  await user.type(input, 'NEW')
  await user.click(screen.getByRole('button', { name: 'Найти' }))

  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(
    'Ищем производителей…',
  )

  nextSearch.resolve([])
  await screen.findByText('Производители для этого артикула не найдены.')
})
