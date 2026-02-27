import React, { useState } from 'react'
import { Badge } from "./ui/badge"
import { Code, Eye, FileText, WifiOff, AlertCircle, Clock, Server, HelpCircle } from "lucide-react"
import { JsonViewer } from "./JsonViewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { parseError, getErrorConfig, isStructuredError } from "../lib/errors"

// Pure function: Get status badge variant (Single Responsibility)
const getStatusVariant = (status) => {
  if (!status) return "default"
  const code = parseInt(status.split(" ")[0], 10)

  if (code >= 200 && code < 300) return "success"
  if (code >= 300 && code < 400) return "redirect"
  if (code >= 400 && code < 500) return "clientError"
  if (code >= 500) return "serverError"
  return "default"
}

export function ResponsePanel({ response, status, responseType = 'text', responseTime }) {
  // Check if response is an error
  const isError = status === 'Error' || responseType === 'error' || (response && (response.startsWith('Error:') || response.startsWith('Network Error')))

  // Parse error if present
  const errorObj = isError ? parseError(response) : null
  const errorConfig = errorObj ? getErrorConfig(errorObj) : null

  // Error icon mapping
  const ErrorIcons = {
    network: WifiOff,
    validation: AlertCircle,
    timeout: Clock,
    server: Server,
    unknown: HelpCircle
  }
  const ErrorIconComponent = errorConfig ? ErrorIcons[errorObj?.type] || HelpCircle : null

  // Default to 'preview' if it's html or image, otherwise 'body'
  const defaultTab = (responseType === 'html' || responseType === 'image') ? 'preview' : 'body'
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Sync tab with response type when it changes (optional, but good UX)
  React.useEffect(() => {
    if (responseType === 'html' || responseType === 'image') {
      setActiveTab('preview')
    } else {
      setActiveTab('body')
    }
  }, [responseType, response]) // Reset when response changes

  const hasPreview = responseType === 'html' || responseType === 'image'

  return (
    <div className="flex h-[40%] flex-col border-t border-border/60 bg-muted/5">
      {/* Response Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Response</span>
            {status && (
              <Badge variant={getStatusVariant(status)} className="font-mono">
                {status}
              </Badge>
            )}
            {/* Error type badge */}
            {isError && errorConfig && (
              <Badge variant="outline" className={`text-[10px] uppercase ${errorConfig.bg} ${errorConfig.color} ${errorConfig.border}`}>
                {ErrorIconComponent && <ErrorIconComponent className="h-3 w-3 mr-1 inline" />}
                {errorConfig.title}
              </Badge>
            )}
            {responseType !== 'text' && responseType !== 'error' && (
              <Badge variant="outline" className="text-[10px] uppercase">{responseType}</Badge>
            )}
          </div>

          {/* View Toggles */}
          <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
            <button
              onClick={() => setActiveTab('body')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${activeTab === 'body' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Code className="h-3.5 w-3.5" />
              Raw/JSON
            </button>
            {hasPreview && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${activeTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            )}
          </div>
        </div>

        {responseTime && (
          <div className="text-xs text-muted-foreground/70">
            {responseTime}ms
          </div>
        )}
      </div>

      {/* Response Body */}
      <div className="flex-1 overflow-hidden relative">
        {isError && errorObj ? (
          // Error display banner
          <div className={`h-full p-6 ${errorConfig.bg} border-l-4 ${errorConfig.border} overflow-auto`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${errorConfig.bg} flex-shrink-0`}>
                {ErrorIconComponent && <ErrorIconComponent className={`h-6 w-6 ${errorConfig.color}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-semibold ${errorConfig.color}`}>
                  {errorConfig.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 break-words">{errorObj.message}</p>
                {errorObj.details && (
                  <details className="mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Error details
                    </summary>
                    <pre className="mt-2 text-xs bg-background/50 rounded p-3 overflow-x-auto">
                      {typeof errorObj.details === 'string' ? errorObj.details : JSON.stringify(errorObj.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'body' && (
          <JsonViewer data={response} />
        )}

        {activeTab === 'preview' && !isError && (
          <div className="h-full w-full bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 overflow-auto">
            {responseType === 'html' && (
              <iframe
                srcDoc={response}
                title="Response Preview"
                className="h-full w-full border-none"
                sandbox="allow-scripts"
              />
            )}
            {responseType === 'image' && (
              <div className="flex items-center justify-center p-8 min-h-full">
                <img src={response} alt="Response Preview" className="max-w-full h-auto shadow-md rounded-md border" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
