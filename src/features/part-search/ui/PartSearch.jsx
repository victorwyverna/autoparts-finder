import { useDispatch, useSelector } from 'react-redux'

import { PartsTable } from '../../../entities/part'
import {
  searchManufacturers,
  searchOffers,
  selectManufacturerOptions,
  selectManufacturerStatus,
  selectOffersStatus,
  selectParts,
} from '../model/partSearchSlice'
import { ManufacturerOptions } from './ManufacturerOptions'
import { PartSearchForm } from './PartSearchForm'

export function PartSearch() {
  const dispatch = useDispatch()
  const manufacturerOptions = useSelector(selectManufacturerOptions)
  const manufacturerStatus = useSelector(selectManufacturerStatus)
  const offersStatus = useSelector(selectOffersStatus)
  const parts = useSelector(selectParts)

  return (
    <section aria-label="Поиск запчастей" className="search-card">
      <PartSearchForm
        isLoading={manufacturerStatus === 'loading'}
        onSearch={(number) => dispatch(searchManufacturers(number))}
      />

      {manufacturerStatus === 'loading' && (
        <div className="d-flex align-items-center gap-2 mt-4" role="status">
          <span aria-hidden="true" className="spinner-border spinner-border-sm" />
          <span>Ищем производителей…</span>
        </div>
      )}

      {manufacturerStatus === 'failed' && (
        <div className="alert alert-danger mt-4 mb-0" role="alert">
          Не удалось найти производителей. Попробуйте ещё раз.
        </div>
      )}

      {manufacturerStatus === 'succeeded' &&
        manufacturerOptions.length === 0 && (
          <p className="alert alert-info mt-4 mb-0">
            Производители для этого артикула не найдены.
          </p>
        )}

      {manufacturerStatus === 'succeeded' && manufacturerOptions.length > 0 && (
        <ManufacturerOptions
          disabled={offersStatus === 'loading'}
          onSelect={(option) => dispatch(searchOffers(option))}
          options={manufacturerOptions}
        />
      )}

      {offersStatus === 'loading' && (
        <div className="d-flex align-items-center gap-2 mt-4" role="status">
          <span aria-hidden="true" className="spinner-border spinner-border-sm" />
          <span>Ищем предложения…</span>
        </div>
      )}

      {offersStatus === 'failed' && (
        <div className="alert alert-danger mt-4 mb-0" role="alert">
          Не удалось загрузить предложения. Попробуйте ещё раз.
        </div>
      )}

      {offersStatus === 'succeeded' && parts.length === 0 && (
        <p className="alert alert-info mt-4 mb-0">
          Предложения для выбранной детали не найдены.
        </p>
      )}

      {offersStatus === 'succeeded' && parts.length > 0 && (
        <div className="mt-5">
          <h2 className="h4 mb-3">Найденные предложения</h2>
          <PartsTable parts={parts} />
        </div>
      )}
    </section>
  )
}
