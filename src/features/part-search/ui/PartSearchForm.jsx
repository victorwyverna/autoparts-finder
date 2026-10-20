import { useState } from 'react'

export function PartSearchForm({ isLoading, onSearch }) {
  const [number, setNumber] = useState('')
  const [validationError, setValidationError] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()

    if (isLoading) {
      return
    }

    const normalizedNumber = number.trim()

    if (!normalizedNumber) {
      setValidationError('Введите артикул детали')
      return
    }

    setValidationError(null)
    onSearch(normalizedNumber)
  }

  return (
    <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
      <div className="col-md">
        <label className="form-label fw-semibold" htmlFor="part-number">
          Артикул детали
        </label>
        <input
          aria-describedby={validationError ? 'part-number-error' : undefined}
          aria-invalid={Boolean(validationError)}
          className={`form-control form-control-lg${validationError ? ' is-invalid' : ''}`}
          id="part-number"
          onChange={(event) => {
            setNumber(event.target.value)
            setValidationError(null)
          }}
          placeholder="Например, W9142"
          value={number}
        />
        {validationError && (
          <div className="invalid-feedback" id="part-number-error">
            {validationError}
          </div>
        )}
      </div>
      <div className="col-md-auto">
        <button
          className="btn btn-primary btn-lg w-100"
          disabled={isLoading}
          type="submit"
        >
          Найти
        </button>
      </div>
    </form>
  )
}
