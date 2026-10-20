import { afterEach, expect, test, vi } from 'vitest'

import { getConfig } from './index'

afterEach(() => {
  vi.unstubAllEnvs()
})

test('returns the API configuration from Vite environment variables', () => {
  expect(
    getConfig({
      VITE_API_BASE_URL: 'https://api.example.com/v1/',
      VITE_API_KEY: 'public-api-key',
    }),
  ).toEqual({
    apiBaseUrl: 'https://api.example.com/v1/',
    apiKey: 'public-api-key',
  })
})

test('reads Vite environment variables when called without arguments', () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/v2/')
  vi.stubEnv('VITE_API_KEY', 'default-environment-key')

  expect(getConfig()).toEqual({
    apiBaseUrl: 'https://api.example.com/v2/',
    apiKey: 'default-environment-key',
  })
})

test('throws when VITE_API_BASE_URL is missing', () => {
  expect(() =>
    getConfig({
      VITE_API_KEY: 'public-api-key',
    }),
  ).toThrow('VITE_API_BASE_URL is required')
})

test.each(['', '   ', 'not-a-url', 'ftp://api.example.com'])(
  'throws when VITE_API_BASE_URL is not a valid HTTP(S) URL: %j',
  (apiBaseUrl) => {
    expect(() =>
      getConfig({
        VITE_API_BASE_URL: apiBaseUrl,
        VITE_API_KEY: 'public-api-key',
      }),
    ).toThrow('VITE_API_BASE_URL must be a valid HTTP(S) URL')
  },
)

test.each([undefined, '', '   '])(
  'throws when VITE_API_KEY is missing or empty: %j',
  (apiKey) => {
    expect(() =>
      getConfig({
        VITE_API_BASE_URL: 'https://api.example.com/v1/',
        VITE_API_KEY: apiKey,
      }),
    ).toThrow('VITE_API_KEY is required')
  },
)
