import React, { useState } from 'react'
import { Badge } from "./ui/badge"
import { Code, Eye, FileText } from "lucide-react"
import { JsonViewer } from "./JsonViewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

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
    <div className="flex h-[40%] flex-col border-t border-border/50 bg-muted/5">
      {/* Response Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Response</span>
            {status && (
              <Badge variant={getStatusVariant(status)} className="font-mono">
                {status}
              </Badge>
            )}
            {responseType !== 'text' && (
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
        {activeTab === 'body' && (
          <JsonViewer data={response} />
        )}

        {activeTab === 'preview' && (
          <div className="h-full w-full bg-white text-black overflow-auto">
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
