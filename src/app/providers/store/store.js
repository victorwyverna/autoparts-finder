import { configureStore } from '@reduxjs/toolkit'

import { partSearchReducer } from '../../../features/part-search'

export const store = configureStore({
  reducer: {
    partSearch: partSearchReducer,
  },
})
