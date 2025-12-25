import React from "react"
import { Send, Save, Globe } from "lucide-react"
import { Button } from "./ui/button"
import { Select } from "./ui/select"
import { Input } from "./ui/input"
import { cn } from "../lib/utils"

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"]

const methodColors = {
  GET: "text-blue-400",
  POST: "text-green-400",
  PUT: "text-orange-400",
  DELETE: "text-red-400",
  PATCH: "text-yellow-400",
  HEAD: "text-purple-400",
}

export function RequestBar({ activeRequest, onMethodChange, onUrlChange, onNameChange, onSend, onSave, loading }) {
  const [showShortcuts, setShowShortcuts] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        onSend()
      }
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        onSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onSend, onSave])

  return (
    <div className="border-b bg-muted/10 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Method Selector */}
        <div className="relative">
          <Select
            value={activeRequest.method}
            onChange={(e) => onMethodChange(e.target.value)}
            className="w-24 font-mono text-sm"
            style={{ color: methodColors[activeRequest.method] }}
          >
            {HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </div>

        {/* URL Input */}
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="https://api.example.com/endpoint"
            value={activeRequest.url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="pl-9 font-mono text-sm"
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={onSend}
          disabled={loading}
          size="sm"
          className={cn(
            "gap-2 font-medium",
            loading && "animate-pulse-glow"
          )}
          title="Send request (Ctrl+Enter)"
        >
          <Send className="h-4 w-4" />
          {loading ? "Sending..." : "Send"}
        </Button>

        {/* Save Button */}
        <Button
          onClick={onSave}
          variant="secondary"
          size="sm"
          className="gap-2"
          title="Save request (Ctrl+S)"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>

        {/* Request Name Input */}
        <div className="relative w-40">
          <Input
            type="text"
            placeholder="Request name"
            value={activeRequest.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      {/* Keyboard shortcuts bar */}
      <div
        className="flex items-center justify-between border-t px-4 py-1.5 text-xs text-muted-foreground/70 transition-opacity"
        onMouseEnter={() => setShowShortcuts(true)}
        onMouseLeave={() => setShowShortcuts(false)}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd>Ctrl</kbd>+<kbd>Enter</kbd> Send
          </span>
          <span className="flex items-center gap-1">
            <kbd>Ctrl</kbd>+<kbd>S</kbd> Save
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd>Ctrl</kbd>+<kbd>N</kbd> New
          </span>
        </div>
      </div>
    </div>
  )
}
