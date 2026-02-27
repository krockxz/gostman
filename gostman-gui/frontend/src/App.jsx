import { useEffect, useCallback, lazy, Suspense } from 'react'
import { RotateCcw, Import, Loader2 } from "lucide-react"
import { SendRequest, GetRequests, SaveRequest, DeleteRequest, GetVariables, SaveVariables } from "../wailsjs/go/main/App"
import { Sidebar } from "./components/Sidebar"
import { RequestBar } from "./components/RequestBar"
import { ResponsePanel } from "./components/ResponsePanel"
import { AlertDialog } from "./components/ui/AlertDialog"
import { ConfirmDialog } from "./components/ui/ConfirmDialog"
import { PromptDialog } from "./components/ui/PromptDialog"
// Lazy load heavy dialogs
const CodeSnippetDialog = lazy(() => import("./components/CodeSnippetDialog").then(module => ({ default: module.CodeSnippetDialog })))
const ImportExportDialog = lazy(() => import("./components/ImportExportDialog").then(module => ({ default: module.ImportExportDialog })))
import { MonacoEditor } from "./components/MonacoEditor"
import { TabBar } from "./components/TabBar"
import { Button } from "./components/ui/button"
import { RequestTabs } from "./components/RequestTabs"
import { generateAllSnippets } from "./lib/codeGenerator"
import { useAppStore, useActiveTab } from "./store/appStore"
import { parseJSON } from "./lib/dataUtils"
import { validateEnvVariables } from "./lib/validation"
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

  // Dialog state
  const alertDialog = useAppStore((s) => s.alertDialog)
  const confirmDialog = useAppStore((s) => s.confirmDialog)
  const promptDialog = useAppStore((s) => s.promptDialog)

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

  // Dialog actions
  const showAlert = useAppStore((s) => s.showAlert)
  const closeAlert = useAppStore((s) => s.closeAlert)
  const showConfirm = useAppStore((s) => s.showConfirm)
  const closeConfirm = useAppStore((s) => s.closeConfirm)
  const showPrompt = useAppStore((s) => s.showPrompt)
  const closePrompt = useAppStore((s) => s.closePrompt)

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
    showPrompt(
      'Create Folder',
      'Enter a name for the new folder:',
      '',
      'Folder name',
      (name) => {
        if (name?.trim()) {
          addFolder(name.trim())
        }
      }
    )
  }

  const handleDeleteFolder = (folderId) => {
    showConfirm(
      'Delete Folder',
      'Delete this folder? Requests inside will be moved to root.',
      () => deleteFolder(folderId),
      null,
      'default'
    )
  }



  const handleSave = async () => {
    try {
      const msg = await SaveRequest(activeRequest)
      showAlert('Success', msg, 'OK', 'success')
      await refreshRequests()
    } catch (e) {
      console.error(e)
      showAlert('Error', `Failed to save: ${e.message}`, 'OK', 'warning')
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    showConfirm(
      'Delete Request',
      'Are you sure you want to delete this request? This action cannot be undone.',
      async () => {
        try {
          await DeleteRequest(id)
          await refreshRequests()
          newTab()
        } catch (e) {
          console.error(e)
          showAlert('Error', `Failed to delete: ${e.message}`, 'OK', 'warning')
        }
      },
      null,
      'destructive'
    )
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
    showConfirm(
      'Clear History',
      'Are you sure you want to clear all request history?',
      () => clearHistory(),
      null,
      'default'
    )
  }

  const handleSaveVars = async () => {
    // Validate before saving
    const validation = validateEnvVariables(variables)
    if (!validation.valid) {
      showAlert('Validation Error', validation.error, 'OK', 'warning')
      return
    }

    try {
      const msg = await SaveVariables(variables)
      showAlert('Success', msg, 'OK', 'success')
    } catch (e) {
      console.error(e)
      showAlert('Error', `Failed to save: ${e.message}`, 'OK', 'warning')
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
      showAlert('Success', 'Import completed successfully!', 'OK', 'success')
    } catch (e) {
      console.error("Import failed:", e)
      showAlert('Import Failed', e.message, 'OK', 'warning')
    }
  }



  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/60 bg-muted/10 backdrop-blur-md px-6 py-2.5">
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
              showConfirm(
                'Reset Application',
                'Reset application state? This will clear all data and reload the application.',
                () => {
                  localStorage.clear()
                  window.location.reload()
                },
                null,
                'destructive'
              )
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
              EditorComponent={MonacoEditor}
              defaultTab={useAppStore((s) => s.activeRequestTab) || 'body'}
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

      {/* Custom Dialogs (non-blocking alternatives to alert/confirm/prompt) */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        confirmText={alertDialog.confirmText}
        variant={alertDialog.variant}
        onConfirm={closeAlert}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={() => {
          confirmDialog.onConfirm?.()
          closeConfirm()
        }}
        onCancel={closeConfirm}
      />

      <PromptDialog
        isOpen={promptDialog.isOpen}
        title={promptDialog.title}
        message={promptDialog.message}
        placeholder={promptDialog.placeholder}
        defaultValue={promptDialog.defaultValue}
        confirmText={promptDialog.confirmText}
        onConfirm={(value) => {
          promptDialog.onConfirm?.(value)
          closePrompt()
        }}
        onCancel={closePrompt}
      />
    </div>
  )
}

export default App
