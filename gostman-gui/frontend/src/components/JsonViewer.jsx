import { JsonView } from 'react-json-view-lite'

import { useState, useCallback, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

// Pure function: Parse JSON safely (Single Responsibility)
const parseJSON = (data) => {
  if (typeof data === 'object' && data !== null) return data
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }
  return null
}

// Pure function: Syntax highlighter (Single Responsibility)
const syntaxHighlight = (json) => {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-string'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key'
          return `<span class="${cls}">${match.slice(0, -1)}</span>:`
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      } else if (/^-?\d+/.test(match)) {
        cls = 'json-number'
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}

export function JsonViewer({ data }) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState('tree')

  // Memoized parsed data (avoid recomputation)
  const jsonData = useMemo(() => parseJSON(data), [data])
  const isValidJSON = jsonData !== null

  // Memoized JSON string for raw view
  const jsonRaw = useMemo(() => {
    if (typeof data === 'string') return data
    return JSON.stringify(data, null, 2)
  }, [data])

  // Copy handler with useCallback (stable reference)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonRaw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [jsonRaw])

  // If no data, show empty state
  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Check className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">No response data</p>
        <p className="mt-2 text-xs text-muted-foreground/50">
          Send a request to see the response here
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-2 bg-muted/20">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === 'tree' ? 'default' : 'ghost'}
            onClick={() => setViewMode('tree')}
            disabled={!isValidJSON}
          >
            Tree
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'raw' ? 'default' : 'ghost'}
            onClick={() => setViewMode('raw')}
          >
            Raw
          </Button>
          {!isValidJSON && (
            <Badge variant="secondary" className="text-xs">
              Non-JSON
            </Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {viewMode === 'tree' && isValidJSON ? (
          <div className="json-tree-wrapper">
            <JsonView data={jsonData} shouldExpandNode={(level) => level < 2} />
          </div>
        ) : (
          <pre
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonRaw) }}
          />
        )}
      </div>
    </div>
  )
}
