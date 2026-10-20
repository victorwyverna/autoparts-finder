export function ManufacturerOptions({ disabled, options, onSelect }) {
  return (
    <fieldset className="mt-4">
      <legend className="h5">Выберите производителя</legend>
      <div className="d-flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className="btn btn-outline-primary text-start"
            disabled={disabled}
            key={JSON.stringify([option.brand, option.number])}
            onClick={() => onSelect(option)}
            type="button"
          >
            <span className="fw-semibold">{option.brand}</span>
            <span className="d-block small">{option.number}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
