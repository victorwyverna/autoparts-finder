import { expect, test } from 'vitest'

import { store } from './store'

test('registers the part search reducer', () => {
  expect(store.getState().partSearch).toMatchObject({
    query: '',
    manufacturerOptions: [],
    selectedManufacturer: null,
    parts: [],
    manufacturerStatus: 'idle',
    offersStatus: 'idle',
  })
})
