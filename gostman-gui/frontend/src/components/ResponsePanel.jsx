import { useState } from "react"
import { Badge } from "./ui/badge"
import { Code, Clock } from "lucide-react"
import { JsonViewer } from "./JsonViewer"

function getStatusVariant(status) {
  if (!status) return "default"
  const statusCode = parseInt(status.split(" ")[0])

  if (statusCode >= 200 && statusCode < 300) return "success"
  if (statusCode >= 300 && statusCode < 400) return "redirect"
  if (statusCode >= 400 && statusCode < 500) return "clientError"
  if (statusCode >= 500) return "serverError"
  return "default"
}



export function ResponsePanel({ response, status }) {
  const [responseTime] = useState(Math.floor(Math.random() * 200 + 50)) // Simulated response time

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
      </div>

      {/* Response Body */}
      {response ? (
        <JsonViewer data={response} />
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
    </div>
  )
}
