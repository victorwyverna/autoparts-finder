export function ManufacturerOptions({ disabled, options, onSelect, selected }) {
  return (
    <fieldset className="mt-4">
      <legend className="h5">Выберите производителя</legend>
      <div className="d-flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected =
            selected?.brand === option.brand &&
            selected?.number === option.number

          return (
            <button
              aria-pressed={isSelected}
              className={`btn btn-outline-primary text-start${isSelected ? ' active' : ''}`}
              disabled={disabled}
              key={JSON.stringify([option.brand, option.number])}
              onClick={() => onSelect(option)}
              type="button"
            >
              <span className="fw-semibold">{option.brand}</span>
              <span className="d-block small">{option.number}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
