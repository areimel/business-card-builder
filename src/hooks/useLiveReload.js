import { useEffect, useRef } from 'react'

// Subscribes to server-sent change events; EventSource reconnects on its own.
export function useLiveReload(onChange) {
  const handler = useRef(onChange)
  handler.current = onChange

  useEffect(() => {
    const source = new EventSource('/api/events')
    source.onmessage = (event) => {
      try {
        handler.current(JSON.parse(event.data))
      } catch {
        /* ignore malformed payloads */
      }
    }
    return () => source.close()
  }, [])
}
