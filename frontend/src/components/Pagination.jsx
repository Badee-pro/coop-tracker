const PAGE_SIZES = [10, 25, 50, 100]

function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const list = new Set([1, pages, page - 1, page, page + 1])
  const sorted = [...list].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['…', p] : [p]))
}

export default function Pagination({ page, pageSize, total, onPage, onPageSize }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className="pagination">
      <span className="muted">
        {from}–{to} of {total}
      </span>

      <div className="pages">
        <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page">
          ‹
        </button>
        {pageList(page, pages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="page-gap">…</span>
          ) : (
            <button key={p} className={`page-btn ${p === page ? 'current' : ''}`} onClick={() => onPage(p)}>
              {p}
            </button>
          ),
        )}
        <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === pages} aria-label="Next page">
          ›
        </button>
      </div>

      <label className="page-size">
        Rows
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
