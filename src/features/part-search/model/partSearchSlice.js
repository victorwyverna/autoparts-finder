import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { getManufacturerOptions, normalizeParts } from '../../../entities/part'
import { searchAnalogues, searchParts } from '../../../shared/api'

const initialState = {
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
}

export const searchManufacturers = createAsyncThunk(
  'partSearch/searchManufacturers',
  async (number) => getManufacturerOptions(await searchParts(number)),
)

export const searchOffers = createAsyncThunk(
  'partSearch/searchOffers',
  async (position) => normalizeParts(await searchAnalogues(position)),
)

function resetOffers(state) {
  state.parts = []
  state.offersStatus = 'idle'
  state.offersError = null
  state.offersRequestId = null
}

const partSearchSlice = createSlice({
  name: 'partSearch',
  initialState,
  reducers: {
    manufacturerSelected(state, action) {
      state.selectedManufacturer = action.payload
      resetOffers(state)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchManufacturers.pending, (state, action) => {
        state.query = action.meta.arg
        state.manufacturerOptions = []
        state.selectedManufacturer = null
        state.manufacturerStatus = 'loading'
        state.manufacturerError = null
        state.manufacturerRequestId = action.meta.requestId
        resetOffers(state)
      })
      .addCase(searchManufacturers.fulfilled, (state, action) => {
        if (state.manufacturerRequestId !== action.meta.requestId) {
          return
        }

        state.manufacturerOptions = action.payload
        state.manufacturerStatus = 'succeeded'
        state.manufacturerRequestId = null
      })
      .addCase(searchManufacturers.rejected, (state, action) => {
        if (state.manufacturerRequestId !== action.meta.requestId) {
          return
        }

        state.manufacturerStatus = 'failed'
        state.manufacturerError = action.error.message ?? 'Unknown error'
        state.manufacturerRequestId = null
      })
      .addCase(searchOffers.pending, (state, action) => {
        state.selectedManufacturer = action.meta.arg
        state.parts = []
        state.offersStatus = 'loading'
        state.offersError = null
        state.offersRequestId = action.meta.requestId
      })
      .addCase(searchOffers.fulfilled, (state, action) => {
        if (state.offersRequestId !== action.meta.requestId) {
          return
        }

        state.parts = action.payload
        state.offersStatus = 'succeeded'
        state.offersRequestId = null
      })
      .addCase(searchOffers.rejected, (state, action) => {
        if (state.offersRequestId !== action.meta.requestId) {
          return
        }

        state.offersStatus = 'failed'
        state.offersError = action.error.message ?? 'Unknown error'
        state.offersRequestId = null
      })
  },
})

export const { manufacturerSelected } = partSearchSlice.actions
export const partSearchReducer = partSearchSlice.reducer

const selectPartSearch = (state) => state.partSearch

export const selectSearchQuery = (state) => selectPartSearch(state).query
export const selectManufacturerOptions = (state) =>
  selectPartSearch(state).manufacturerOptions
export const selectSelectedManufacturer = (state) =>
  selectPartSearch(state).selectedManufacturer
export const selectParts = (state) => selectPartSearch(state).parts
export const selectManufacturerStatus = (state) =>
  selectPartSearch(state).manufacturerStatus
export const selectManufacturerError = (state) =>
  selectPartSearch(state).manufacturerError
export const selectOffersStatus = (state) =>
  selectPartSearch(state).offersStatus
export const selectOffersError = (state) => selectPartSearch(state).offersError
