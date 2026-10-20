import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { App } from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

test('renders the project heading', () => {
  render(<App />)

  expect(
    screen.getByRole('heading', { name: 'Поиск автозапчастей' }),
  ).toBeInTheDocument()
})

test('renders the two-stage part search on the home page', () => {
  render(<App />)

  expect(screen.getByLabelText('Артикул детали')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Найти' })).toBeInTheDocument()
})

test('starts with a clean document between tests', () => {
  expect(
    screen.queryByRole('heading', { name: 'Поиск автозапчастей' }),
  ).not.toBeInTheDocument()
})

test('mounts the real Redux provider without errors', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  render(<App />)

  expect(consoleError).not.toHaveBeenCalled()
})
