import React from "react"
import { Plus, Trash2, FileJson, Search, Clock, RotateCcw, Sparkles, Zap } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { cn } from "../lib/utils"

function formatRelativeTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const methodColors = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
  PATCH: "patch",
  HEAD: "head",
}

const EmptyStateCollections = ({ hasSearch }) => (
  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
    <div className="mb-4 relative">
      <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-150" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 shadow-lg shadow-primary/5">
        {hasSearch ? (
          <Search className="h-7 w-7 text-primary" />
        ) : (
          <Sparkles className="h-7 w-7 text-primary" />
        )}
      </div>
    </div>
    <p className="text-sm font-medium text-foreground mb-1">
      {hasSearch ? "No requests found" : "Create your first request"}
    </p>
    <p className="text-xs text-muted-foreground leading-relaxed">
      {hasSearch
        ? "Try adjusting your search terms"
        : "Press Ctrl+N to get started"}
    </p>
  </div>
)

const EmptyStateHistory = ({ hasSearch }) => (
  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
    <div className="mb-4 relative">
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl scale-150 animate-pulse" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/10 shadow-lg shadow-blue-500/5">
        <Zap className="h-7 w-7 text-blue-500" />
      </div>
    </div>
    <p className="text-sm font-medium text-foreground mb-1">
      {hasSearch ? "No history found" : "No request history"}
    </p>
    <p className="text-xs text-muted-foreground leading-relaxed">
      {hasSearch
        ? "Try different search terms"
        : "Sent requests appear here automatically"}
    </p>
  </div>
)

export function Sidebar({
  requests = [],
  requestHistory = [],
  activeRequest,
  onSelectRequest,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  onNewRequest,
  onDeleteRequest
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [historySearchQuery, setHistorySearchQuery] = React.useState("")

  // Check if history features are enabled
  const hasHistoryFeatures = onSelectHistoryItem && onDeleteHistoryItem && onClearHistory

  const filteredRequests = (requests || []).filter(req =>
    req.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.url?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredHistory = hasHistoryFeatures ? (requestHistory || []).filter(req =>
    req.url?.toLowerCase().includes(historySearchQuery.toLowerCase())
  ) : []

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/50 bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
              <FileJson className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight">Gostman</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onNewRequest}
            className="h-8 w-8 rounded-lg hover:bg-muted transition-colors"
            title="New request (Ctrl+N)"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="collections" className="flex flex-1 flex-col">
        <TabsList className={`grid ${hasHistoryFeatures ? 'grid-cols-2' : 'grid-cols-1'} rounded-none border-b border-border/50 bg-transparent p-0`}>
          <TabsTrigger value="collections" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5">
            <FileJson className="h-3.5 w-3.5" />
            Collections
          </TabsTrigger>
          {hasHistoryFeatures && (
            <TabsTrigger value="history" className="gap-1.5 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5">
              <Clock className="h-3.5 w-3.5" />
              History
              {requestHistory?.length > 0 && (
                <Badge variant="secondary" className="ml-auto h-4.5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-primary/20">
                  {requestHistory.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Collections Tab */}
        <TabsContent value="collections" className="flex flex-1 flex-col overflow-hidden p-0 m-0">
          <div className="border-b border-border/50 px-3 py-2.5 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm bg-background border-border/50 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredRequests.length === 0 ? (
              <EmptyStateCollections hasSearch={!!searchQuery} />
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredRequests.map((req, idx) => (
                  <div
                    key={req.id}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-200",
                      "hover:bg-accent/60 cursor-pointer",
                      activeRequest.id === req.id && "bg-accent shadow-sm"
                    )}
                    onClick={() => onSelectRequest(req)}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <Badge
                      variant={methodColors[req.method] || "default"}
                      className="shrink-0 font-mono text-[10px] px-1.5 py-0.5"
                    >
                      {req.method}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {req.name || "Untitled Request"}
                      </div>
                      {req.url && (
                        <div className="truncate text-xs text-muted-foreground/80">
                          {req.url}
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-6 w-6 shrink-0 opacity-0 transition-all duration-200",
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

          {/* Footer */}
          <div className="border-t border-border/50 px-3 py-2 bg-muted/20">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-medium">{requests.length} request{requests.length !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/50 font-mono text-[10px]">Ctrl+N</kbd> new
              </span>
            </div>
          </div>
        </TabsContent>

        {/* History Tab - only render if history features are enabled */}
        {hasHistoryFeatures && (
          <TabsContent value="history" className="flex flex-1 flex-col overflow-hidden p-0 m-0">
            <div className="border-b border-border/50 px-3 py-2.5 bg-muted/20">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search history..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="h-8 pl-8 text-sm bg-background border-border/50 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {filteredHistory.length === 0 ? (
                <EmptyStateHistory hasSearch={!!historySearchQuery} />
              ) : (
                <div className="p-2 space-y-0.5">
                  {filteredHistory.map((req, idx) => (
                    <div
                      key={req.id}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-200",
                        "hover:bg-accent/60 cursor-pointer"
                      )}
                      onClick={() => onSelectHistoryItem(req)}
                    >
                      <Badge
                        variant={methodColors[req.method] || "default"}
                        className="shrink-0 font-mono text-[10px] px-1.5 py-0.5"
                      >
                        {req.method}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {req.url}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatRelativeTime(req.timestamp)}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "h-6 w-6 shrink-0 opacity-0 transition-all duration-200",
                          "group-hover:opacity-100",
                          "hover:bg-destructive/20 hover:text-destructive"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteHistoryItem(req.id)
                        }}
                        title="Delete from history"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear History */}
            {requestHistory?.length > 0 && (
              <div className="border-t border-border/50 px-3 py-2 bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearHistory}
                  className="w-full gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear all history
                </Button>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
