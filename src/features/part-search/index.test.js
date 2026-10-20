import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, expect, test, vi } from 'vitest'

import { searchAnalogues, searchParts } from '../../shared/api'
import {
  manufacturerSelected,
  partSearchReducer,
  searchManufacturers,
  searchOffers,
  selectManufacturerError,
  selectManufacturerOptions,
  selectManufacturerStatus,
  selectOffersError,
  selectOffersStatus,
  selectParts,
  selectSearchQuery,
  selectSelectedManufacturer,
} from './index'

vi.mock('../../shared/api', () => ({
  searchAnalogues: vi.fn(),
  searchParts: vi.fn(),
}))

const searchPartsMock = vi.mocked(searchParts)
const searchAnaloguesMock = vi.mocked(searchAnalogues)

function createPartSearchStore(preloadedState) {
  return configureStore({
    reducer: { partSearch: partSearchReducer },
    preloadedState: preloadedState
      ? { partSearch: preloadedState }
      : undefined,
  })
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

function rawPart({
  goodsID = 'part-1',
  brand = 'MANN',
  number = 'W 914/2',
  name = 'Масляный фильтр',
} = {}) {
  return {
    goodsID,
    brand,
    number,
    name,
    warehouses: [
      {
        id: 'warehouse-1',
        code: 'МС2',
        own: true,
        price: 500,
        stock: 4,
        shipmentDate: '2026-10-21T18:00:00',
      },
    ],
    analogues: [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('starts with an idle empty two-stage search', () => {
  expect(partSearchReducer(undefined, { type: 'unknown' })).toEqual({
    query: '',
    manufacturerOptions: [],
    selectedManufacturer: null,
    parts: [],
    manufacturerStatus: 'idle',
    manufacturerError: null,
    manufacturerRequestId: null,
    offersStatus: 'idle',
    offersError: null,
    offersRequestId: null,
  })
})

test('searches manufacturer options through the public API and domain model', async () => {
  searchPartsMock.mockResolvedValue([
    rawPart(),
    rawPart({ goodsID: 'part-2' }),
    rawPart({ goodsID: 'part-3', brand: 'BOSCH', number: '0 451 103 336' }),
  ])
  const store = createPartSearchStore()

  await store.dispatch(searchManufacturers('W9142'))

  expect(searchPartsMock).toHaveBeenCalledWith('W9142')
  expect(store.getState().partSearch).toMatchObject({
    query: 'W9142',
    manufacturerOptions: [
      { brand: 'MANN', number: 'W 914/2' },
      { brand: 'BOSCH', number: '0 451 103 336' },
    ],
    manufacturerStatus: 'succeeded',
    manufacturerError: null,
    manufacturerRequestId: null,
  })
})

test('keeps an empty manufacturer response successful', async () => {
  searchPartsMock.mockResolvedValue([])
  const store = createPartSearchStore()

  await store.dispatch(searchManufacturers('UNKNOWN'))

  expect(store.getState().partSearch).toMatchObject({
    manufacturerOptions: [],
    manufacturerStatus: 'succeeded',
    manufacturerError: null,
  })
})

test('stores a manufacturer search error as a serializable message', async () => {
  searchPartsMock.mockRejectedValue(new Error('API unavailable'))
  const store = createPartSearchStore()

  await store.dispatch(searchManufacturers('W9142'))

  expect(store.getState().partSearch).toMatchObject({
    manufacturerOptions: [],
    manufacturerStatus: 'failed',
    manufacturerError: 'API unavailable',
    manufacturerRequestId: null,
  })
})

test('a new number search clears the dependent stage immediately', async () => {
  const pendingSearch = deferred()
  searchPartsMock.mockReturnValue(pendingSearch.promise)
  const store = createPartSearchStore({
    query: 'OLD',
    manufacturerOptions: [{ brand: 'OLD', number: 'OLD' }],
    selectedManufacturer: { brand: 'OLD', number: 'OLD' },
    parts: [{ goodsID: 'old-part' }],
    manufacturerStatus: 'failed',
    manufacturerError: 'old manufacturer error',
    manufacturerRequestId: null,
    offersStatus: 'failed',
    offersError: 'old offers error',
    offersRequestId: 'old-request',
  })

  const request = store.dispatch(searchManufacturers('NEW'))

  expect(store.getState().partSearch).toMatchObject({
    query: 'NEW',
    manufacturerOptions: [],
    selectedManufacturer: null,
    parts: [],
    manufacturerStatus: 'loading',
    manufacturerError: null,
    offersStatus: 'idle',
    offersError: null,
    offersRequestId: null,
  })

  pendingSearch.resolve([])
  await request
})

test('an older manufacturer response cannot replace the latest result', async () => {
  const oldSearch = deferred()
  const newSearch = deferred()
  searchPartsMock.mockImplementation((number) =>
    number === 'OLD' ? oldSearch.promise : newSearch.promise,
  )
  const store = createPartSearchStore()

  const oldRequest = store.dispatch(searchManufacturers('OLD'))
  const newRequest = store.dispatch(searchManufacturers('NEW'))
  newSearch.resolve([rawPart({ brand: 'NEW', number: 'NEW-1' })])
  await newRequest
  oldSearch.resolve([rawPart({ brand: 'OLD', number: 'OLD-1' })])
  await oldRequest

  expect(store.getState().partSearch).toMatchObject({
    query: 'NEW',
    manufacturerOptions: [{ brand: 'NEW', number: 'NEW-1' }],
    manufacturerStatus: 'succeeded',
  })
})

test('normalizes the selected manufacturer results into parts and offers', async () => {
  searchAnaloguesMock.mockResolvedValue([rawPart()])
  const store = createPartSearchStore()
  const selected = { brand: 'MANN', number: 'W 914/2' }

  await store.dispatch(searchOffers(selected))

  expect(searchAnaloguesMock).toHaveBeenCalledWith(selected)
  expect(store.getState().partSearch).toMatchObject({
    selectedManufacturer: selected,
    parts: [
      {
        goodsID: 'part-1',
        brand: 'MANN',
        number: 'W 914/2',
        name: 'Масляный фильтр',
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
    ],
    offersStatus: 'succeeded',
    offersError: null,
    offersRequestId: null,
  })
})

test('keeps an empty offers response successful', async () => {
  searchAnaloguesMock.mockResolvedValue([])
  const store = createPartSearchStore()

  await store.dispatch(searchOffers({ brand: 'MANN', number: 'UNKNOWN' }))

  expect(store.getState().partSearch).toMatchObject({
    parts: [],
    offersStatus: 'succeeded',
    offersError: null,
  })
})

test('stores an offers search error as a serializable message', async () => {
  searchAnaloguesMock.mockRejectedValue(new Error('Analogue search failed'))
  const store = createPartSearchStore()

  await store.dispatch(searchOffers({ brand: 'MANN', number: 'W 914/2' }))

  expect(store.getState().partSearch).toMatchObject({
    parts: [],
    offersStatus: 'failed',
    offersError: 'Analogue search failed',
    offersRequestId: null,
  })
})

test('loading another manufacturer clears the previous parts immediately', async () => {
  const pendingSearch = deferred()
  searchAnaloguesMock.mockReturnValue(pendingSearch.promise)
  const store = createPartSearchStore()

  store.dispatch(manufacturerSelected({ brand: 'OLD', number: 'OLD-1' }))
  const request = store.dispatch(
    searchOffers({ brand: 'NEW', number: 'NEW-1' }),
  )

  expect(store.getState().partSearch).toMatchObject({
    selectedManufacturer: { brand: 'NEW', number: 'NEW-1' },
    parts: [],
    offersStatus: 'loading',
    offersError: null,
  })

  pendingSearch.resolve([])
  await request
})

test('selecting another manufacturer invalidates an unfinished offers request', async () => {
  const pendingSearch = deferred()
  searchAnaloguesMock.mockReturnValue(pendingSearch.promise)
  const store = createPartSearchStore()

  const oldRequest = store.dispatch(
    searchOffers({ brand: 'OLD', number: 'OLD-1' }),
  )
  store.dispatch(manufacturerSelected({ brand: 'NEW', number: 'NEW-1' }))
  pendingSearch.resolve([rawPart({ brand: 'OLD', number: 'OLD-1' })])
  await oldRequest

  expect(store.getState().partSearch).toMatchObject({
    selectedManufacturer: { brand: 'NEW', number: 'NEW-1' },
    parts: [],
    offersStatus: 'idle',
    offersError: null,
    offersRequestId: null,
  })
})

test('an older offers response cannot replace the latest result', async () => {
  const oldSearch = deferred()
  const newSearch = deferred()
  searchAnaloguesMock.mockImplementation(({ brand }) =>
    brand === 'OLD' ? oldSearch.promise : newSearch.promise,
  )
  const store = createPartSearchStore()

  const oldRequest = store.dispatch(
    searchOffers({ brand: 'OLD', number: 'OLD-1' }),
  )
  const newRequest = store.dispatch(
    searchOffers({ brand: 'NEW', number: 'NEW-1' }),
  )
  newSearch.resolve([rawPart({ brand: 'NEW', number: 'NEW-1' })])
  await newRequest
  oldSearch.resolve([rawPart({ brand: 'OLD', number: 'OLD-1' })])
  await oldRequest

  expect(store.getState().partSearch).toMatchObject({
    selectedManufacturer: { brand: 'NEW', number: 'NEW-1' },
    parts: [expect.objectContaining({ brand: 'NEW', number: 'NEW-1' })],
    offersStatus: 'succeeded',
  })
})

test('selectors expose source state without storing derived loading flags', () => {
  const state = {
    partSearch: {
      query: 'W9142',
      manufacturerOptions: [{ brand: 'MANN', number: 'W 914/2' }],
      selectedManufacturer: { brand: 'MANN', number: 'W 914/2' },
      parts: [{ goodsID: 'part-1' }],
      manufacturerStatus: 'failed',
      manufacturerError: 'manufacturer error',
      offersStatus: 'loading',
      offersError: 'offers error',
    },
  }

  expect(selectSearchQuery(state)).toBe('W9142')
  expect(selectManufacturerOptions(state)).toEqual([
    { brand: 'MANN', number: 'W 914/2' },
  ])
  expect(selectSelectedManufacturer(state)).toEqual({
    brand: 'MANN',
    number: 'W 914/2',
  })
  expect(selectParts(state)).toEqual([{ goodsID: 'part-1' }])
  expect(selectManufacturerStatus(state)).toBe('failed')
  expect(selectManufacturerError(state)).toBe('manufacturer error')
  expect(selectOffersStatus(state)).toBe('loading')
  expect(selectOffersError(state)).toBe('offers error')
})
