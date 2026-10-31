export default function DocumentList({ docs, activeSlug, onSelect }) {
  return (
    <nav className="doc-list" aria-label="Documents">
      {docs.map((d) => (
        <button
          key={d.slug}
          className={`doc-item${d.slug === activeSlug ? ' active' : ''}`}
          aria-current={d.slug === activeSlug ? 'true' : undefined}
          onClick={() => onSelect(d.slug)}
        >
          <span className="doc-title">{d.title || d.slug}</span>
          <span className="doc-meta">
            {d.slug} · {d.theme}{d.mode ? ` · ${d.mode}` : ''}
          </span>
        </button>
      ))}
    </nav>
  )
}
