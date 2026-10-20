export function getRootElement(documentObject) {
  const rootElement = documentObject.getElementById('root')

  if (!rootElement) {
    throw new Error('Root element not found')
  }

  return rootElement
}
