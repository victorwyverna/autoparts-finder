export function HomePage() {
  return (
    <main className="d-flex min-vh-100 align-items-center bg-body-tertiary py-5">
      <div className="container">
        <div className="mx-auto text-center" style={{ maxWidth: '42rem' }}>
          <p className="mb-2 text-uppercase text-secondary">Favorit Parts</p>
          <h1 className="display-5 fw-semibold">Поиск автозапчастей</h1>
          <p className="mt-3 mb-0 fs-5 text-secondary">
            Подбор производителей, аналогов и доступных предложений по
            артикулу детали.
          </p>
        </div>
      </div>
    </main>
  )
}
