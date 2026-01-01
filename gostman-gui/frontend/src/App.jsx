import { useEffect, useCallback, lazy, Suspense } from 'react'
import { RotateCcw, Import, Loader2 } from "lucide-react"
import { SendRequest, GetRequests, SaveRequest, DeleteRequest, GetVariables, SaveVariables } from "../wailsjs/go/main/App"
import { Sidebar } from "./components/Sidebar"
import { RequestBar } from "./components/RequestBar"
import { ResponsePanel } from "./components/ResponsePanel"
// Lazy load heavy dialogs
const CodeSnippetDialog = lazy(() => import("./components/CodeSnippetDialog").then(module => ({ default: module.CodeSnippetDialog })))
const ImportExportDialog = lazy(() => import("./components/ImportExportDialog").then(module => ({ default: module.ImportExportDialog })))
import { Textarea } from "./components/ui/textarea"
import { TabBar } from "./components/TabBar"
import { Button } from "./components/ui/button"
import { RequestTabs } from "./components/RequestTabs"
import { generateAllSnippets } from "./lib/codeGenerator"
import { useAppStore, useActiveTab } from "./store/appStore"
import { parseJSON } from "./lib/dataUtils"
import logo from "./assets/logo.jpg"

function App() {
  // Zustand store hooks
  const requests = useAppStore((s) => s.requests)
  const requestHistory = useAppStore((s) => s.requestHistory)
  const folders = useAppStore((s) => s.folders)
  const tabs = useAppStore((s) => s.tabs)
  const activeTabId = useAppStore((s) => s.activeTabId)
  const variables = useAppStore((s) => s.variables)
  const codeDialogOpen = useAppStore((s) => s.codeDialogOpen)
  const codeSnippets = useAppStore((s) => s.codeSnippets)
  const importDialogOpen = useAppStore((s) => s.importDialogOpen)

  // Store actions
  const setRequests = useAppStore((s) => s.setRequests)
  const setFolders = useAppStore((s) => s.setFolders)
  const setVariables = useAppStore((s) => s.setVariables)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const newTab = useAppStore((s) => s.newTab)
  const closeTab = useAppStore((s) => s.closeTab)
  const updateActiveTab = useAppStore((s) => s.updateActiveTab)
  const updateActiveRequest = useAppStore((s) => s.updateActiveRequest)
  const loadRequestIntoTab = useAppStore((s) => s.loadRequestIntoTab)
  const loadHistoryIntoTab = useAppStore((s) => s.loadHistoryIntoTab)
  const addToHistory = useAppStore((s) => s.addToHistory)
  const deleteHistoryItem = useAppStore((s) => s.deleteHistoryItem)
  const clearHistory = useAppStore((s) => s.clearHistory)
  const addFolder = useAppStore((s) => s.addFolder)
  const deleteFolder = useAppStore((s) => s.deleteFolder)
  const toggleFolder = useAppStore((s) => s.toggleFolder)
  const openCodeDialog = useAppStore((s) => s.openCodeDialog)
  const closeCodeDialog = useAppStore((s) => s.closeCodeDialog)
  const openImportDialog = useAppStore((s) => s.openImportDialog)
  const closeImportDialog = useAppStore((s) => s.closeImportDialog)

  // Get active tab
  const activeTab = useActiveTab()
  const activeRequest = activeTab?.request || {}

  // -- Data Loading --

  const fetchInitialData = useCallback(async () => {
    try {
      const [reqs, vars] = await Promise.all([GetRequests(), GetVariables()])
      setRequests(reqs || [])
      setVariables(vars || "{}")
      // Folders currently local-only for desktop until backend support
      setFolders([])
    } catch (e) {
      console.error("Failed to load data:", e)
    }
  }, [setRequests, setVariables, setFolders])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const refreshRequests = async () => {
    const reqs = await GetRequests()
    setRequests(reqs || [])
  }

  // -- Tab Management --

  const updateField = (field, value) => {
    updateActiveRequest({ [field]: value })
  }

  // Keyboard shortcut for New Request (Ctrl+N)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        newTab()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [newTab])

  const handleCreateFolder = () => {
    const name = prompt("Enter folder name:")
    if (name) {
      addFolder(name)
    }
  }

  const handleDeleteFolder = (folderId) => {
    if (confirm("Delete folder? Requests inside will be moved to root.")) {
      deleteFolder(folderId)
    }
  }



  const handleSave = async () => {
    try {
      const msg = await SaveRequest(activeRequest)
      alert(msg)
      await refreshRequests()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    if (confirm("Are you sure you want to delete this request?")) {
      try {
        await DeleteRequest(id)
        await refreshRequests()
        newTab()
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleSend = async () => {
    updateActiveTab({ loading: true, status: 'Sending...', responseTime: null })
    const startTime = performance.now()

    const getResponseTime = () => Math.round(performance.now() - startTime)

    try {
      const resp = await SendRequest(
        activeRequest.method,
        activeRequest.url,
        activeRequest.headers,
        activeRequest.body,
        activeRequest.queryParams
      )

      updateActiveTab({
        request: { ...activeRequest, response: resp.body },
        status: resp.status,
        responseTime: getResponseTime(),
        loading: false
      })

      addToHistory(activeRequest)
    } catch (e) {
      updateActiveTab({
        request: { ...activeRequest, response: "Error: " + e },
        status: "Error",
        responseTime: getResponseTime(),
        loading: false
      })

      addToHistory(activeRequest)
    }
  }

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      clearHistory()
    }
  }

  const handleSaveVars = async () => {
    try {
      const msg = await SaveVariables(variables)
      alert(msg)
    } catch (e) {
      console.error(e)
    }
  }

  const handleGenerateCode = () => {
    const snippets = generateAllSnippets(
      activeRequest.method,
      activeRequest.url,
      activeRequest.headers,
      activeRequest.body,
      activeRequest.queryParams
    )
    openCodeDialog(snippets)
  }

  const handleImport = async (importData) => {
    try {
      if (importData.requests) {
        // Import each request
        for (const req of importData.requests) {
          await SaveRequest(req)
        }
        await refreshRequests()
      }
      if (importData.folders) {
        setFolders(importData.folders)
      }
      if (importData.variables) {
        const varsStr = JSON.stringify(importData.variables, null, 2)
        setVariables(varsStr)
        await SaveVariables(varsStr)
      }
    } catch (e) {
      console.error("Import failed:", e)
      alert("Import failed: " + e.message)
    }
  }



  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-muted/10 backdrop-blur-md px-6 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Gostman Logo" className="h-9 w-9 rounded-lg shadow-lg shadow-primary/25" />
          <div>
            <h1 className="text-base font-brand font-bold tracking-tight">Gostman</h1>
            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">HTTP Client</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openImportDialog}
            className="gap-2"
          >
            <Import className="h-4 w-4" />
            Import / Export
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm("Reset application state? This will clear all data.")) {
                localStorage.clear()
                window.location.reload()
              }
            }}
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
          requestHistory={requestHistory}
          activeRequest={activeRequest}
          onSelectRequest={loadRequestIntoTab}
          onSelectHistoryItem={loadHistoryIntoTab}
          onDeleteHistoryItem={deleteHistoryItem}
          onClearHistory={handleClearHistory}
          onNewRequest={newTab}
          onDeleteRequest={handleDelete}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onToggleFolder={toggleFolder}
          onNewRequestInFolder={newTab}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tab Bar */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTab}
            onTabClose={closeTab}
            onNewTab={newTab}
          />

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
            loading={activeTab?.loading || false}
          />

          <div className="flex flex-1 flex-col overflow-hidden">
            <RequestTabs
              activeRequest={activeRequest}
              onUpdateField={updateField}
              variables={variables}
              onUpdateVariables={setVariables}
              onSaveVars={handleSaveVars}
              response={activeRequest.response || ''}
              responseStatus={activeTab?.status || ''}
              responseHeaders={null}
              EditorComponent={Textarea}
            />

            <ResponsePanel
              response={activeRequest.response || ''}
              status={activeTab?.status || ''}
              responseTime={activeTab?.responseTime}
            />
          </div>
        </div>
      </div>

      {/* Code Snippet Dialog */}
      <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        {codeDialogOpen && codeSnippets && (
          <CodeSnippetDialog
            snippets={codeSnippets}
            onClose={closeCodeDialog}
          />
        )}
      </Suspense>

      {/* Import/Export Dialog */}
      <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        {importDialogOpen && (
          <ImportExportDialog
            requests={requests}
            folders={folders}
            variables={parseJSON(variables, {})}
            onImport={handleImport}
            onClose={closeImportDialog}
          />
        )}
      </Suspense>
    </div>
  )
}

export default App
