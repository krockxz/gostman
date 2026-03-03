import React, { useState, useMemo, useEffect } from 'react'
import { JsonView } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import { Badge } from "./ui/badge"
import { Code, Eye, List, Cookie, WifiOff, AlertCircle, Clock, Server, HelpCircle, FileText, Braces } from "lucide-react"
import { Button } from "./ui/button"
import { parseError, getErrorConfig } from "../lib/errors"

// Pure function: Get status badge variant
const getStatusVariant = (status) => {
  if (!status) return "default"
  const code = parseInt(status.split(" ")[0], 10)
  if (code >= 200 && code < 300) return "success"
  if (code >= 300 && code < 400) return "redirect"
  if (code >= 400 && code < 500) return "clientError"
  if (code >= 500) return "serverError"
  return "default"
}

// Format bytes to human-readable size
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Parse JSON safely
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

// Syntax highlighter for raw JSON/text with theme colors
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

// Parse cookie string from Set-Cookie header
const parseCookieString = (cookieStr) => {
  const parts = cookieStr.split(';').map(p => p.trim())
  const [nameValue, ...attrs] = parts
  const eqIdx = nameValue.indexOf('=')
  const name = eqIdx >= 0 ? nameValue.slice(0, eqIdx) : nameValue
  const value = eqIdx >= 0 ? nameValue.slice(eqIdx + 1) : ''
  const attrMap = {}
  attrs.forEach(a => {
    const ai = a.indexOf('=')
    if (ai >= 0) attrMap[a.slice(0, ai).toLowerCase()] = a.slice(ai + 1)
    else attrMap[a.toLowerCase()] = true
  })
  return {
    name,
    value,
    domain: attrMap['domain'] || '',
    path: attrMap['path'] || '',
    expires: attrMap['expires'] || '',
    secure: !!attrMap['secure'],
    httpOnly: !!attrMap['httponly'],
  }
}

function TabButton({ id, label, icon, count, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
        active
          ? 'bg-background shadow-sm text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span className={`rounded-full px-1.5 py-0 text-[10px] font-semibold ${
          active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

function HeadersTable({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-3 rounded-full bg-muted p-4">
          <List className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">No headers</p>
        <p className="mt-1 text-xs text-muted-foreground/50">Send a request to see response headers</p>
      </div>
    )
  }
  return (
    <div className="h-full overflow-auto pb-4">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm border-b border-border/50 z-10">
          <tr>
            <th className="text-left px-4 py-2 font-semibold text-muted-foreground uppercase tracking-wider w-2/5">Name</th>
            <th className="text-left px-4 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ name, value }, i) => (
            <tr key={i} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
              <td className="px-4 py-2 font-mono font-medium text-primary/80 align-top whitespace-nowrap">{name}</td>
              <td className="px-4 py-2 font-mono text-muted-foreground break-all">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CookiesTable({ cookies }) {
  if (cookies.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-3 rounded-full bg-muted p-4">
          <Cookie className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">No cookies</p>
        <p className="mt-1 text-xs text-muted-foreground/50">The server didn't send any cookies with this response</p>
      </div>
    )
  }
  return (
    <div className="h-full overflow-auto pb-4">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm border-b border-border/50 z-10">
          <tr>
            {['Name', 'Value', 'Domain', 'Path', 'Expires', 'Secure', 'HttpOnly'].map(col => (
              <th key={col} className="text-left px-4 py-2 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cookies.map((c, i) => (
            <tr key={i} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
              <td className="px-4 py-2 font-mono font-medium text-primary/80 whitespace-nowrap">{c.name}</td>
              <td className="px-4 py-2 font-mono text-muted-foreground max-w-[180px] truncate" title={c.value}>{c.value || '—'}</td>
              <td className="px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">{c.domain || '—'}</td>
              <td className="px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">{c.path || '/'}</td>
              <td className="px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">{c.expires || 'Session'}</td>
              <td className="px-4 py-2 text-center">{c.secure ? <span className="text-green-500 font-bold">✓</span> : <span className="text-muted-foreground/30">—</span>}</td>
              <td className="px-4 py-2 text-center">{c.httpOnly ? <span className="text-green-500 font-bold">✓</span> : <span className="text-muted-foreground/30">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ResponsePanel({ response, status, responseTime, responseHeaders, responseCookies, responseSize }) {
  const isError = status === 'Error' || (response && (response.startsWith('Error:') || response.startsWith('Network Error')))

  const errorObj = isError ? parseError(response) : null
  const errorConfig = errorObj ? getErrorConfig(errorObj) : null

  const ErrorIcons = {
    network: WifiOff,
    validation: AlertCircle,
    timeout: Clock,
    server: Server,
    unknown: HelpCircle,
  }
  const ErrorIconComponent = errorConfig ? ErrorIcons[errorObj?.type] || HelpCircle : null

  // Detect content type from headers - improved detection with data URL check
  const detectedType = useMemo(() => {
    // First check if response body is a data URL (image from backend)
    if (response && typeof response === 'string' && response.startsWith('data:image/')) {
      return 'image'
    }

    // Check if response starts with data: for any previewable type
    if (response && typeof response === 'string' && response.startsWith('data:')) {
      // It's a data URL, try to determine the type
      if (response.startsWith('data:image/')) return 'image'
      if (response.startsWith('data:text/html')) return 'html'
    }

    if (!responseHeaders) return 'text'

    // Get content-type from headers (case-insensitive)
    let contentType = ''

    if (Array.isArray(responseHeaders)) {
      // New format: HeaderEntry[]
      const ctHeader = responseHeaders.find(h => h.key.toLowerCase() === 'content-type')
      contentType = ctHeader?.value || ''
    } else {
      // Old format: map
      for (const [key, value] of Object.entries(responseHeaders)) {
        if (key.toLowerCase() === 'content-type') {
          contentType = Array.isArray(value) ? value[0] : value
          break
        }
      }
    }

    if (!contentType) return 'text'

    const ct = contentType.toLowerCase()
    if (ct.includes('text/html')) return 'html'
    if (ct.includes('image/')) return 'image'
    if (ct.includes('application/json') || ct.includes('+json')) return 'json'
    return 'text'
  }, [response, responseHeaders])

  const hasPreview = detectedType === 'html' || detectedType === 'image'

  // Parse cookies: from backend (desktop) or from Set-Cookie header (web)
  const cookies = useMemo(() => {
    if (responseCookies && responseCookies.length > 0) return responseCookies
    if (!responseHeaders) return []

    // Find Set-Cookie header values (case-insensitive)
    let setCookieHeaders = []

    if (Array.isArray(responseHeaders)) {
      // New format: HeaderEntry[]
      setCookieHeaders = responseHeaders
        .filter(h => h.key.toLowerCase() === 'set-cookie')
        .map(h => h.value)
    } else {
      // Old format: map[string][]string
      for (const [key, value] of Object.entries(responseHeaders)) {
        if (key.toLowerCase() === 'set-cookie') {
          setCookieHeaders = Array.isArray(value) ? value : [value]
          break
        }
      }
    }

    if (setCookieHeaders.length === 0) return []
    return setCookieHeaders.map(parseCookieString)
  }, [responseCookies, responseHeaders])

  // Headers are now already in flattened format from backend
  const headerEntries = useMemo(() => {
    if (!responseHeaders) return []

    // Handle both new format (HeaderEntry[]) and old format (map)
    if (Array.isArray(responseHeaders)) {
      return responseHeaders.map(h => ({ name: h.key, value: h.value }))
    }

    // Fallback for old format
    const entries = []
    for (const [key, value] of Object.entries(responseHeaders)) {
      if (Array.isArray(value)) {
        value.forEach(v => {
          entries.push({ name: key, value: v })
        })
      } else {
        entries.push({ name: key, value: String(value) })
      }
    }
    return entries
  }, [responseHeaders])

  const headerCount = headerEntries.length
  const cookieCount = cookies.length

  // Tab state - main tabs (Body, Headers, Cookies)
  const [mainTab, setMainTab] = useState('body')
  const [bodyMode, setBodyMode] = useState('pretty')

  // Reset on new response
  useEffect(() => {
    setMainTab('body')
    setBodyMode('pretty')
  }, [response])

  // Parse JSON for tree view
  const jsonData = useMemo(() => parseJSON(response), [response])
  const isValidJSON = jsonData !== null

  // Get raw response string
  const rawResponse = useMemo(() => {
    if (typeof response === 'string') return response
    return JSON.stringify(response, null, 2)
  }, [response])

  return (
    <div className="flex h-[40%] flex-col border-t border-border/60 bg-muted/5">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/20 px-4 py-2 backdrop-blur-md">
        {/* Status info */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response</span>
          {status && (
            <Badge variant={getStatusVariant(status)} className="font-mono text-[11px]">{status}</Badge>
          )}
          {isError && errorConfig && (
            <Badge variant="outline" className={`text-[10px] uppercase ${errorConfig.bg} ${errorConfig.color} ${errorConfig.border}`}>
              {ErrorIconComponent && <ErrorIconComponent className="h-3 w-3 mr-1 inline" />}
              {errorConfig.title}
            </Badge>
          )}
          {responseSize && (
            <span className="text-[11px] text-muted-foreground/60 font-mono">{formatSize(responseSize)}</span>
          )}
          {responseTime != null && (
            <span className="text-[11px] text-muted-foreground/60 font-mono">{responseTime}ms</span>
          )}
        </div>

        {/* Main tab switcher */}
        <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
          <TabButton id="body" label="Body" icon={<Code className="h-3.5 w-3.5" />} count={0} active={mainTab === 'body'} onClick={setMainTab} />
          <TabButton id="headers" label="Headers" icon={<List className="h-3.5 w-3.5" />} count={headerCount} active={mainTab === 'headers'} onClick={setMainTab} />
          <TabButton id="cookies" label="Cookies" icon={<Cookie className="h-3.5 w-3.5" />} count={cookieCount} active={mainTab === 'cookies'} onClick={setMainTab} />
        </div>

        {/* Body sub-mode toggles - only show on Body tab */}
        {mainTab === 'body' && !isError && response && (
          <div className="ml-auto flex items-center rounded-lg bg-muted/50 p-0.5">
            <button
              onClick={() => setBodyMode('pretty')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                bodyMode === 'pretty'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Braces className="h-3.5 w-3.5" />
              Pretty
            </button>
            <button
              onClick={() => setBodyMode('raw')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                bodyMode === 'raw'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Raw
            </button>
            {hasPreview && (
              <button
                onClick={() => setBodyMode('preview')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  bodyMode === 'preview'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Error state */}
        {isError && errorObj ? (
          <div className={`h-full p-6 ${errorConfig.bg} border-l-4 ${errorConfig.border} overflow-auto`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${errorConfig.bg} flex-shrink-0`}>
                {ErrorIconComponent && <ErrorIconComponent className={`h-6 w-6 ${errorConfig.color}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-semibold ${errorConfig.color}`}>{errorConfig.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 break-words">{errorObj.message}</p>
                {errorObj.details && (
                  <details className="mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Error details</summary>
                    <pre className="mt-2 text-xs bg-background/50 rounded p-3 overflow-x-auto">
                      {typeof errorObj.details === 'string' ? errorObj.details : JSON.stringify(errorObj.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ) : mainTab === 'body' ? (
          <>
            {/* Pretty mode: JSON tree or syntax highlighted */}
            {bodyMode === 'pretty' && (
              <div className="h-full overflow-auto pb-4">
                {response ? (
                  <div className="p-4 font-mono text-sm json-tree-wrapper">
                    {isValidJSON ? (
                      <JsonView data={jsonData} shouldExpandNode={(level) => level < 2} />
                    ) : (
                      <pre
                        className="whitespace-pre-wrap break-words leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: syntaxHighlight(rawResponse) }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="mb-3 rounded-full bg-muted p-4">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">No response data</p>
                    <p className="mt-1 text-xs text-muted-foreground/50">Send a request to see the response here</p>
                  </div>
                )}
              </div>
            )}

            {/* Raw mode: plain monospace text */}
            {bodyMode === 'raw' && (
              <div className="h-full overflow-auto pb-4">
                {response ? (
                  <pre className="p-4 font-mono text-xs whitespace-pre-wrap break-words text-foreground/90 leading-relaxed">{rawResponse}</pre>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <div className="mb-3 rounded-full bg-muted p-4">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">No response data</p>
                    <p className="mt-1 text-xs text-muted-foreground/50">Send a request to see the response here</p>
                  </div>
                )}
              </div>
            )}

            {/* Preview mode: iframe for HTML, img for images */}
            {bodyMode === 'preview' && (
              <div className="h-full w-full bg-background overflow-auto">
                {detectedType === 'html' && (
                  <iframe
                    srcDoc={response}
                    title="Response Preview"
                    className="h-full w-full border-none"
                    sandbox="allow-scripts"
                  />
                )}
                {detectedType === 'image' && (
                  <div className="flex items-center justify-center p-8 min-h-full">
                    <img src={response} alt="Response" className="max-w-full h-auto shadow-md rounded-md border" />
                  </div>
                )}
              </div>
            )}
          </>
        ) : mainTab === 'headers' ? (
          <HeadersTable entries={headerEntries} />
        ) : mainTab === 'cookies' ? (
          <CookiesTable cookies={cookies} />
        ) : null}
      </div>
    </div>
  )
}
