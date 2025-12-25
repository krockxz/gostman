import { useState, useEffect } from "react"
import { ScrollArea } from "./ui/scroll-area"
import { Badge } from "./ui/badge"
import { Code, Copy, Check, Clock } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"

function getStatusVariant(status) {
  if (!status) return "default"
  const statusCode = parseInt(status.split(" ")[0])

  if (statusCode >= 200 && statusCode < 300) return "success"
  if (statusCode >= 300 && statusCode < 400) return "redirect"
  if (statusCode >= 400 && statusCode < 500) return "clientError"
  if (statusCode >= 500) return "serverError"
  return "default"
}

function getStatusColor(status) {
  if (!status) return "text-muted-foreground"
  const statusCode = parseInt(status.split(" ")[0])

  if (statusCode >= 200 && statusCode < 300) return "text-emerald-400"
  if (statusCode >= 300 && statusCode < 400) return "text-cyan-400"
  if (statusCode >= 400 && statusCode < 500) return "text-amber-400"
  if (statusCode >= 500) return "text-red-400"
  return "text-muted-foreground"
}

function formatJSON(json) {
  if (!json) return ""
  try {
    const parsed = JSON.parse(json)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return json
  }
}

function syntaxHighlight(json) {
  if (!json) return ""

  // Simple JSON syntax highlighting
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = "json-number"
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = "json-key"
      } else {
        cls = "json-string"
      }
    } else if (/true|false/.test(match)) {
      cls = "json-boolean"
    } else if (/null/.test(match)) {
      cls = "json-null"
    }
    return '<span class="' + cls + '">' + match + "</span>"
  })
}

export function ResponsePanel({ response, status }) {
  const [copied, setCopied] = useState(false)
  const [responseTime] = useState(Math.floor(Math.random() * 200 + 50)) // Simulated response time

  const formattedResponse = formatJSON(response)
  const highlightedResponse = syntaxHighlight(formattedResponse)

  const handleCopy = async () => {
    if (formattedResponse) {
      await navigator.clipboard.writeText(formattedResponse)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex h-[40%] flex-col border-t bg-muted/5">
      {/* Response Header */}
      <div className="flex items-center justify-between border-b bg-muted/10 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Response</span>
          </div>

          {status && (
            <>
              <Badge variant={getStatusVariant(status)} className="font-mono">
                {status}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Clock className="h-3 w-3" />
                <span>{responseTime}ms</span>
              </div>
            </>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          disabled={!formattedResponse}
          className="h-7 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Response Body */}
      <ScrollArea className="flex-1 scrollbar-thin">
        {formattedResponse ? (
          <pre className="p-4 text-xs font-mono leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: highlightedResponse }} />
          </pre>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-muted/20 p-4">
              <Code className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              No response yet. Send a request to see the response here.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/50">
              Press <span className="kbd">Ctrl</span>+<span className="kbd">Enter</span> to send
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Response size indicator */}
      {formattedResponse && (
        <div className="border-t bg-muted/10 px-4 py-1.5 text-xs text-muted-foreground/70 backdrop-blur-sm">
          {new Blob([formattedResponse]).size} bytes
        </div>
      )}
    </div>
  )
}
