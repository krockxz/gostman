import { useState, useEffect } from "react"
import { LandingPage } from "./components/LandingPage"
import { Sidebar } from "./components/Sidebar"
import { RequestBar } from "./components/RequestBar"
import { ResponsePanel } from "./components/ResponsePanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Textarea } from "./components/ui/textarea"
import { Button } from "./components/ui/button"
import { ScrollArea } from "./components/ui/scroll-area"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { RequestTabs } from "./components/RequestTabs"
import { CodeSnippetDialog } from "./components/CodeSnippetDialog"
import { generateAllSnippets } from "./lib/codeGenerator"
import { parseVariables } from "./lib/variables"
import { prepareRequest, processResponse } from "./lib/requestUtils"
import { sendProxyRequest } from "./lib/api"
import { DEFAULT_REQUEST, mockRequests, mockFolders } from "./lib/mockData"
import { loadState, saveState, resetState, KEYS } from "./lib/storage"

function WebApp() {
  const [showLanding, setShowLanding] = useState(true)
  const [requests, setRequests] = useState(() => loadState(KEYS.REQUESTS, mockRequests))
  const [folders, setFolders] = useState(() => loadState(KEYS.FOLDERS, mockFolders))
  const [requestHistory, setRequestHistory] = useState(() => loadState(KEYS.HISTORY, []))
  const [activeRequest, setActiveRequest] = useState(DEFAULT_REQUEST)
  const [variables, setVariables] = useState(() => loadState(KEYS.VARS, "{}"))
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [responseTime, setResponseTime] = useState(null)

  // Code Generator state
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [snippets, setSnippets] = useState({})

  // Auto-save effects
  useEffect(() => saveState(KEYS.REQUESTS, requests), [requests])
  useEffect(() => saveState(KEYS.FOLDERS, folders), [folders])
  useEffect(() => saveState(KEYS.HISTORY, requestHistory), [requestHistory])
  useEffect(() => saveState(KEYS.VARS, variables), [variables])

  // Original handlers
  const handleSelectRequest = (req) => {
    setActiveRequest(req)
    setStatus("")
    setResponseTime(null)
  }

  const handleNewRequest = (folderId = null) => {
    const newReq = { ...DEFAULT_REQUEST, folderId }
    setActiveRequest(newReq)
    setStatus("")
    setResponseTime(null)
  }

  const handleCreateFolder = () => {
    const name = prompt("Enter folder name:")
    if (name) {
      setFolders([...folders, { id: Date.now().toString(), name, isOpen: true }])
    }
  }

  const handleDeleteFolder = (folderId) => {
    if (confirm("Delete folder? Requests inside will be moved to root.")) {
      // Move requests to root
      setRequests(prev => prev.map(r => r.folderId === folderId ? { ...r, folderId: null } : r))
      // Delete folder
      setFolders(prev => prev.filter(f => f.id !== folderId))
    }
  }

  const handleToggleFolder = (folderId) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isOpen: !f.isOpen } : f))
  }

  const handleSave = async () => {
    // Web version - save to localStorage or API
    // If saving a new request, keep its folderId from activeRequest (if assigned)
    const newRequest = {
      ...activeRequest,
      id: activeRequest.id || Date.now().toString()
    }

    if (activeRequest.id) {
      // Update existing
      setRequests(prev => prev.map(r => r.id === activeRequest.id ? newRequest : r))
    } else {
      // Create new
      setRequests(prev => [...prev, newRequest])
    }

    // Update active request to have the ID if it was new
    setActiveRequest(newRequest)
    alert("Request saved! (Web version)")
  }

  const handleDelete = async (id) => {
    if (!id) return
    if (confirm("Are you sure you want to delete this request?")) {
      setRequests(requests.filter(r => r.id !== id))
      if (activeRequest.id === id) {
        handleNewRequest()
      }
    }
  }

  // History handlers
  const addToHistory = (request) => {
    const historyItem = {
      ...request,
      id: Date.now().toString(), // Unique ID for history item
      timestamp: new Date().toISOString()
    }

    setRequestHistory(prev => {
      // Add to front, limit to 50 items
      const newHistory = [historyItem, ...prev]
      return newHistory.slice(0, 50)
    })
  }

  const handleSelectHistoryItem = (item) => {
    setActiveRequest({
      ...item,
      id: "",
      name: item.name || "History Request"
    })
    setStatus(item.response ? "Loaded from history" : "")
    setResponseTime(null)
  }

  const handleDeleteHistoryItem = (id) => {
    setRequestHistory(prev => prev.filter(item => item.id !== id))
  }

  const handleClearHistory = () => {
    if (confirm("Clear all request history?")) {
      setRequestHistory([])
    }
  }

  const handleSend = async () => {
    setLoading(true)
    setStatus("Sending...")
    setResponseTime(null)
    const startTime = performance.now()

    const getResponseTime = () => Math.round(performance.now() - startTime)

    try {
      const varsMap = parseVariables(variables)
      const { url, method, headers, body } = prepareRequest(activeRequest, varsMap)

      addToHistory({ ...activeRequest, url })

      const response = await sendProxyRequest({ method, url, headers, body })
      const { response: responseData, responseHeaders, responseType, status: statusText } = await processResponse(response)

      setResponseTime(getResponseTime())
      setActiveRequest(prev => ({
        ...prev,
        response: responseData,
        responseHeaders,
        responseType
      }))
      setStatus(statusText)
    } catch (e) {
      setResponseTime(getResponseTime())
      setActiveRequest(prev => ({
        ...prev,
        response: "Error: " + e.message,
        responseType: "text"
      }))
      setStatus("Error")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCode = () => {
    const generated = generateAllSnippets(
      activeRequest.method,
      activeRequest.url,
      activeRequest.headers,
      activeRequest.body,
      activeRequest.queryParams
    )
    setSnippets(generated)
    setShowCodeDialog(true)
  }

  const handleSaveVars = async () => {
    alert("Variables saved! (Web version)")
  }

  const handleGetStarted = () => {
    setShowLanding(false)
  }

  const handleBackToLanding = () => {
    setShowLanding(true)
  }

  const updateField = (field, value) => {
    setActiveRequest(prev => ({ ...prev, [field]: value }))
  }

  // Show landing page for web version
  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-muted/10 backdrop-blur-md px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground font-bold shadow-lg shadow-primary/25">
            <span className="text-lg">G</span>
          </div>
          <div>
            <h1 className="text-base font-brand font-bold tracking-tight">Gostman</h1>
            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">HTTP Client</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToLanding}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Back to landing page"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetState}
            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
            title="Reset to default (Clear data)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          requests={requests}
          folders={folders}
          requestHistory={requestHistory}
          activeRequest={activeRequest}
          onSelectRequest={handleSelectRequest}
          onSelectHistoryItem={handleSelectHistoryItem}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
          onNewRequest={() => handleNewRequest(null)}
          onDeleteRequest={handleDelete}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onToggleFolder={handleToggleFolder}
          onNewRequestInFolder={handleNewRequest}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <RequestBar
            activeRequest={activeRequest}
            onMethodChange={(val) => updateField('method', val)}
            onUrlChange={(val) => updateField('url', val)}
            onNameChange={(val) => updateField('name', val)}
            onHeadersChange={(val) => updateField('headers', val)}
            onBodyChange={(val) => updateField('body', val)}
            onQueryParamsChange={(val) => updateField('queryParams', val)}
            onSend={handleSend}
            onSave={handleSave}
            onGenerateCode={handleGenerateCode}
            loading={loading}
          />

          <div className="flex flex-1 flex-col overflow-hidden">
            <RequestTabs
              activeRequest={activeRequest}
              onUpdateField={updateField}
              variables={variables}
              onUpdateVariables={setVariables}
              onSaveVars={handleSaveVars}
              EditorComponent={Textarea}
            />

            <ResponsePanel
              response={activeRequest.response}
              status={status}
              responseHeaders={activeRequest.responseHeaders}
              responseType={activeRequest.responseType}
              responseTime={responseTime}
            />
          </div>
        </div>

        {showCodeDialog && (
          <CodeSnippetDialog
            snippets={snippets}
            onClose={() => setShowCodeDialog(false)}
          />
        )}
      </div>
    </div>
  )
}

export default WebApp
