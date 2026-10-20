import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { App } from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

test('starts directly with the search controls without an introductory heading', () => {
  render(<App />)

  const main = screen.getByRole('main')
  const search = screen.getByRole('region', { name: 'Поиск запчастей' })

  expect(main.firstElementChild).toBe(search)
  expect(screen.queryByRole('heading')).not.toBeInTheDocument()
})

test('renders the two-stage part search on the home page', () => {
  render(<App />)

  expect(screen.getByLabelText('Артикул детали')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Поиск' })).toBeInTheDocument()
})

test('starts with a clean document between tests', () => {
  expect(
    screen.queryByRole('region', { name: 'Поиск запчастей' }),
  ).not.toBeInTheDocument()
})

test('mounts the real Redux provider without errors', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  render(<App />)

  expect(consoleError).not.toHaveBeenCalled()
})
