export function getConfig(environment = import.meta.env) {
  const apiBaseUrl = environment.VITE_API_BASE_URL
  const apiKey = environment.VITE_API_KEY

  if (apiBaseUrl === undefined) {
    throw new Error('VITE_API_BASE_URL is required')
  }

  let parsedApiBaseUrl

  try {
    parsedApiBaseUrl = new URL(apiBaseUrl)
  } catch {
    throw new Error('VITE_API_BASE_URL must be a valid HTTP(S) URL')
  }

  if (!['http:', 'https:'].includes(parsedApiBaseUrl.protocol)) {
    throw new Error('VITE_API_BASE_URL must be a valid HTTP(S) URL')
  }

  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('VITE_API_KEY is required')
  }

  return {
    apiBaseUrl,
    apiKey,
  }
}
