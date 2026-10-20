import { PartSearch } from '@/features/part-search'

export function HomePage() {
  return (
    <main className="page-shell py-5">
      <div className="container">
        <header className="mx-auto text-center" style={{ maxWidth: '42rem' }}>
          <p className="eyebrow mb-2">Favorit Parts</p>
          <h1 className="display-5 fw-semibold">Поиск автозапчастей</h1>
          <p className="mt-3 mb-0 fs-5 text-secondary">
            Подбор производителей, аналогов и доступных предложений по
            артикулу детали.
          </p>
        </header>

        <div className="mt-5">
          <PartSearch />
        </div>
      </div>
    </main>
  )
}
