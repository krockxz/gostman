import React from "react"
import { Plus, Trash2, FileJson, Search, FolderOpen } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { cn } from "../lib/utils"

const methodColors = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
  PATCH: "patch",
  HEAD: "head",
}

export function Sidebar({ requests, activeRequest, onSelectRequest, onNewRequest, onDeleteRequest }) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredRequests = requests.filter(req =>
    req.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.url?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      {/* Header */}
      <div className="border-b bg-muted/10 px-3 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/20 text-primary">
              <FileJson className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight">Collections</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onNewRequest}
            className="h-7 w-7"
            title="New request (Ctrl+N)"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Request List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredRequests.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 rounded-full bg-muted/50 p-3">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No requests found" : "No requests yet"}
            </p>
            {!searchQuery && (
              <p className="mt-1 text-xs text-muted-foreground/70">
                Press <span className="kbd">Ctrl+N</span> to create one
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className={cn(
                  "group relative flex items-center gap-2 rounded-md px-2.5 py-2 transition-all duration-200",
                  "hover:bg-accent/50 cursor-pointer",
                  activeRequest.id === req.id && "bg-accent shadow-sm"
                )}
                onClick={() => onSelectRequest(req)}
              >
                <Badge
                  variant={methodColors[req.method] || "default"}
                  className="shrink-0 font-mono text-[10px]"
                >
                  {req.method}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {req.name || "Untitled Request"}
                  </div>
                  {req.url && (
                    <div className="truncate text-xs text-muted-foreground">
                      {req.url}
                    </div>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-6 w-6 shrink-0 opacity-0 transition-opacity",
                    "group-hover:opacity-100",
                    "hover:bg-destructive/20 hover:text-destructive"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteRequest(req.id)
                  }}
                  title="Delete request"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                {activeRequest.id === req.id && (
                  <div className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/50" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="border-t bg-muted/10 px-3 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{requests.length} request{requests.length !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1">
            <kbd>Ctrl</kbd>+<kbd>N</kbd> to add
          </span>
        </div>
      </div>
    </div>
  )
}
