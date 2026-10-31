import { useCallback, useEffect, useState } from 'react'
import { getDocuments, getFonts, getThemes } from './api.js'
import { useLiveReload } from './hooks/useLiveReload.js'
import DocumentList from './components/DocumentList.jsx'
import ResumeWorkspace from './components/ResumeWorkspace.jsx'

const EXAMPLE = `---
title: Your Name — Role
theme: terminal
page:
  size: Letter
  margin: 0.5in
---

<Header>

# Your Name

</Header>`

export default function App() {
  const [docs, setDocs] = useState([])
  const [themes, setThemes] = useState([])
  const [slug, setSlug] = useState(null)
  const [fonts, setFonts] = useState([])
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState(null)
  const [loaded, setLoaded] = useState(false)

  const refreshDocs = useCallback(async () => {
    try {
      const list = await getDocuments()
      setDocs(list)
      setSlug((cur) => (list.some((d) => d.slug === cur) ? cur : list[0]?.slug ?? null))
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    Promise.all([refreshDocs(), getThemes().then(setThemes).catch((e) => setError(e.message)),
      getFonts().then(setFonts).catch((e) => setError(e.message))])
      .finally(() => setLoaded(true))
  }, [refreshDocs])

  useLiveReload(() => {
    setReloadKey((k) => k + 1)
    refreshDocs()
  })

  const doc = docs.find((d) => d.slug === slug)
  const theme = themes.find((item) => item.id === doc?.theme)

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="sidebar-head">
          <span className="logo" aria-hidden="true" />
          <h1>Resume Builder</h1>
        </header>
        <DocumentList docs={docs} activeSlug={slug} onSelect={setSlug} />
      </aside>
      <main className="main">
        {doc && loaded ? (
          <ResumeWorkspace key={`${doc.slug}:${doc.theme}`} doc={doc} theme={theme}
            fonts={fonts} reloadKey={reloadKey} />
        ) : (
          <div className="empty">
            {error ? (
              <p className="error-text">Could not reach the API: {error}</p>
            ) : loaded ? (
              <>
                <h2>No documents yet</h2>
                <p>Add an .mdx file to documents/ to get started.</p>
                <pre>{EXAMPLE}</pre>
              </>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}
