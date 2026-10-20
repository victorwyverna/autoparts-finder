import { afterEach, expect, test, vi } from 'vitest'

import { searchAnalogues, searchParts } from './index'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

test('requests parts by number and returns the raw goods array', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/hsprice/')
  vi.stubEnv('VITE_API_KEY', 'key &/=?')

  const goods = [{ brand: 'MANN-FILTER', number: 'HU 719/7 X' }]
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ goods }),
  })
  vi.stubGlobal('fetch', fetchMock)

  const result = await searchParts('HU 719/7 X&?')

  expect(result).toBe(goods)
  expect(fetchMock).toHaveBeenCalledOnce()
  expect(fetchMock.mock.calls[0][0].toString()).toBe(
    'https://api.example.com/hsprice/?key=key+%26%2F%3D%3F&number=HU+719%2F7+X%26%3F',
  )
})

test('requests analogues for the selected number and brand', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/hsprice/')
  vi.stubEnv('VITE_API_KEY', 'public-api-key')

  const goods = [{ brand: 'Bosch & Co', number: 'A/B 12' }]
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ goods }),
  })
  vi.stubGlobal('fetch', fetchMock)

  const result = await searchAnalogues({
    number: 'A/B 12',
    brand: 'Bosch & Co',
  })

  expect(result).toBe(goods)
  expect(fetchMock.mock.calls[0][0].toString()).toBe(
    'https://api.example.com/hsprice/?key=public-api-key&number=A%2FB+12&brand=Bosch+%26+Co&analogues=on',
  )
})

test('reports a network failure and preserves its cause', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/hsprice/')
  vi.stubEnv('VITE_API_KEY', 'public-api-key')

  const cause = new TypeError('Failed to fetch')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause))

  await expect(searchParts('ABC-123')).rejects.toMatchObject({
    message: 'Favorit Parts API is unavailable',
    cause,
  })
})

test('reports an unsuccessful HTTP status', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/hsprice/')
  vi.stubEnv('VITE_API_KEY', 'public-api-key')
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }),
  )

  await expect(searchParts('ABC-123')).rejects.toThrow(
    'Favorit Parts API request failed with HTTP 503',
  )
})

test('reports invalid JSON and preserves the parsing error', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/hsprice/')
  vi.stubEnv('VITE_API_KEY', 'public-api-key')

  const cause = new SyntaxError('Unexpected token')
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(cause),
    }),
  )

  await expect(searchParts('ABC-123')).rejects.toMatchObject({
    message: 'Favorit Parts API returned invalid JSON',
    cause,
  })
})

test('reports an error returned by the API', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/hsprice/')
  vi.stubEnv('VITE_API_KEY', 'public-api-key')
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ error: 'Invalid API key' }),
    }),
  )

  await expect(searchParts('ABC-123')).rejects.toThrow(
    'Favorit Parts API error: Invalid API key',
  )
})
