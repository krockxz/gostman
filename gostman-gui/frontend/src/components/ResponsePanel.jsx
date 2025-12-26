import { Badge } from "./ui/badge"
import { Code } from "lucide-react"
import { JsonViewer } from "./JsonViewer"

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

export function ResponsePanel({ response, status, responseTime }) {
  return (
    <div className="flex h-[40%] flex-col border-t bg-muted/5">
      {/* Response Header */}
      <div className="flex items-center justify-between border-b bg-muted/10 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Response</span>
          {status && (
            <Badge variant={getStatusVariant(status)} className="font-mono">
              {status}
            </Badge>
          )}
        </div>
        {responseTime && (
          <div className="text-xs text-muted-foreground/70">
            {responseTime}ms
          </div>
        )}
      </div>

      {/* Response Body */}
      <JsonViewer data={response} />
    </div>
  )
}
