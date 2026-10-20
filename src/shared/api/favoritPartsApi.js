import { getConfig } from '../config'

async function requestGoods(parameters) {
  const { apiBaseUrl, apiKey } = getConfig()
  const url = new URL(apiBaseUrl)

  url.searchParams.set('key', apiKey)

  for (const [name, value] of Object.entries(parameters)) {
    url.searchParams.set(name, value)
  }

  let response

  try {
    response = await fetch(url)
  } catch (cause) {
    throw new Error('Favorit Parts API is unavailable', { cause })
  }

  if (!response.ok) {
    throw new Error(
      `Favorit Parts API request failed with HTTP ${response.status}`,
    )
  }

  let data

  try {
    data = await response.json()
  } catch (cause) {
    throw new Error('Favorit Parts API returned invalid JSON', { cause })
  }

  if (data && Object.hasOwn(data, 'error')) {
    throw new Error(`Favorit Parts API error: ${data.error}`)
  }

  return data.goods
}

export function searchParts(number) {
  return requestGoods({ number })
}

export function searchAnalogues({ number, brand }) {
  return requestGoods({ number, brand, analogues: 'on' })
}
