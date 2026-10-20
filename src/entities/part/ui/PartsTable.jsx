const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('ru-RU')

function formatPrice(price) {
  return price === null ? '—' : priceFormatter.format(price)
}

function formatDate(value) {
  if (value === null) {
    return '—'
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function PartsTable({ parts }) {
  return (
    <div className="table-responsive">
      <table
        aria-label="Предложения по запчастям"
        className="table align-middle"
      >
        <thead>
          <tr>
            <th scope="col">Название</th>
            <th scope="col">Производитель</th>
            <th scope="col">Артикул</th>
            <th scope="col">Тип</th>
            <th scope="col">Склад</th>
            <th scope="col">Цена</th>
            <th scope="col">Остаток</th>
            <th scope="col">Отгрузка</th>
          </tr>
        </thead>
        <tbody>
          {parts.flatMap((part) =>
            part.offers.map((offer, offerIndex) => (
              <tr key={`${part.goodsID}-${offer.warehouse?.id ?? 'none'}-${offerIndex}`}>
                <td>{part.name}</td>
                <td>{part.brand}</td>
                <td>{part.number}</td>
                <td>{part.isAnalogue ? 'Аналог' : 'Оригинал'}</td>
                <td>{offer.warehouse?.code ?? 'Нет предложений'}</td>
                <td>{formatPrice(offer.price)}</td>
                <td>{offer.stock}</td>
                <td>{formatDate(offer.shipmentDate)}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}
