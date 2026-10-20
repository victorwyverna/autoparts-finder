import { afterEach, expect, test } from 'vitest'

import { getRootElement } from './getRootElement'

afterEach(() => {
  document.body.replaceChildren()
})

test('returns the application root element', () => {
  const rootElement = document.createElement('div')
  rootElement.id = 'root'
  document.body.append(rootElement)

  expect(getRootElement(document)).toBe(rootElement)
})

test('throws when the application root element is missing', () => {
  expect(() => getRootElement(document)).toThrow('Root element not found')
})
