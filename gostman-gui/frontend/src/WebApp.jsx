import { useEffect, lazy, Suspense } from "react"
import { LandingPage } from "./components/LandingPage"
import { Sidebar } from "./components/Sidebar"
import { RequestBar } from "./components/RequestBar"
import { ResponsePanel } from "./components/ResponsePanel"
import { AlertDialog } from "./components/ui/AlertDialog"
import { ConfirmDialog } from "./components/ui/ConfirmDialog"
import { PromptDialog } from "./components/ui/PromptDialog"
import { CommandPalette } from "./components/ui/CommandPalette"
import { MonacoEditor } from "./components/MonacoEditor"
import { Button } from "./components/ui/button"
import { ArrowLeft, RotateCcw, Import, Loader2 } from "lucide-react"
import { RequestTabs } from "./components/RequestTabs"
// Lazy load heavy dialogs
const CodeSnippetDialog = lazy(() => import("./components/CodeSnippetDialog").then(module => ({ default: module.CodeSnippetDialog })))
const ImportExportDialog = lazy(() => import("./components/ImportExportDialog").then(module => ({ default: module.ImportExportDialog })))
import { generateAllSnippets } from "./lib/codeGenerator"
import { parseVariables } from "./lib/variables"
import { prepareRequest, processResponse } from "./lib/requestUtils"
import { sendProxyRequest } from "./lib/api"
import { DEFAULT_REQUEST, mockRequests, mockFolders } from "./lib/mockData"
import { loadState, saveState, resetState, KEYS } from "./lib/storage"
import { useAppStore } from "./store/appStore"
import { parseJSON } from "./lib/dataUtils"
import { validateEnvVariables } from "./lib/validation"
import logo from "./assets/logo.svg"

function WebApp() {
  // Zustand store hooks
  const showLanding = useAppStore((s) => s.showLanding)
  const requests = useAppStore((s) => s.requests)
  const folders = useAppStore((s) => s.folders)
  const requestHistory = useAppStore((s) => s.requestHistory)
  const variables = useAppStore((s) => s.variables)
  const status = useAppStore((s) => s.webStatus)
  const loading = useAppStore((s) => s.webLoading)
  const responseTime = useAppStore((s) => s.webResponseTime)
  const codeDialogOpen = useAppStore((s) => s.codeDialogOpen)
  const codeSnippets = useAppStore((s) => s.codeSnippets)
  const importDialogOpen = useAppStore((s) => s.importDialogOpen)
  const activeRequestTab = useAppStore((s) => s.activeRequestTab)

  // Dialog state
  const alertDialog = useAppStore((s) => s.alertDialog)
  const confirmDialog = useAppStore((s) => s.confirmDialog)
  const promptDialog = useAppStore((s) => s.promptDialog)
  const commandPaletteOpen = useAppStore((s) => s.commandPaletteOpen)

  // Store actions
  const setRequests = useAppStore((s) => s.setRequests)
  const setFolders = useAppStore((s) => s.setFolders)
  const setRequestHistory = useAppStore((s) => s.setRequestHistory)
  const setActiveRequest = useAppStore((s) => s.setActiveRequest)
  const setVariables = useAppStore((s) => s.setVariables)
  const setWebStatus = useAppStore((s) => s.setWebStatus)
  const setWebLoading = useAppStore((s) => s.setWebLoading)
  const setWebResponseTime = useAppStore((s) => s.setWebResponseTime)
  const openCodeDialog = useAppStore((s) => s.openCodeDialog)
  const closeCodeDialog = useAppStore((s) => s.closeCodeDialog)
  const openImportDialog = useAppStore((s) => s.openImportDialog)
  const closeImportDialog = useAppStore((s) => s.closeImportDialog)
  const setShowLanding = useAppStore((s) => s.setShowLanding)
  const addFolder = useAppStore((s) => s.addFolder)
  const deleteFolder = useAppStore((s) => s.deleteFolder)
  const toggleFolder = useAppStore((s) => s.toggleFolder)
  const addToHistory = useAppStore((s) => s.addToHistory)
  const deleteHistoryItem = useAppStore((s) => s.deleteHistoryItem)
  const clearHistory = useAppStore((s) => s.clearHistory)

  // Dialog actions
  const showAlert = useAppStore((s) => s.showAlert)
  const closeAlert = useAppStore((s) => s.closeAlert)
  const showConfirm = useAppStore((s) => s.showConfirm)
  const closeConfirm = useAppStore((s) => s.closeConfirm)
  const showPrompt = useAppStore((s) => s.showPrompt)
  const closePrompt = useAppStore((s) => s.closePrompt)
  const openCommandPalette = useAppStore((s) => s.openCommandPalette)
  const closeCommandPalette = useAppStore((s) => s.closeCommandPalette)

  // Get active request (web version uses single request, not tabs)
  const activeRequest = useAppStore((s) => s.activeRequest || DEFAULT_REQUEST)

  // Load initial state from localStorage
  useEffect(() => {
    setRequests(loadState(KEYS.REQUESTS, mockRequests))
    setFolders(loadState(KEYS.FOLDERS, mockFolders))
    setRequestHistory(loadState(KEYS.HISTORY, []))
    setVariables(loadState(KEYS.VARS, "{}"))
  }, [])

  // Auto-save to localStorage
  useEffect(() => {
    saveState(KEYS.REQUESTS, requests)
    saveState(KEYS.FOLDERS, folders)
    saveState(KEYS.HISTORY, requestHistory)
    saveState(KEYS.VARS, variables)
  }, [requests, folders, requestHistory, variables])

  // Handlers
  const handleSelectRequest = (req) => {
    setActiveRequest(req)
    setWebStatus("")
    setWebResponseTime(null)
  }

  const handleNewRequest = (folderId = null) => {
    const newReq = { ...DEFAULT_REQUEST, folderId, id: Date.now().toString() }
    setActiveRequest(newReq)
    setWebStatus("")
    setWebResponseTime(null)
  }

  const handleCreateFolder = () => {
    showPrompt(
      'New Folder',
      'Folder name:',
      '',
      'My Folder',
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
      'Move requests to root?',
      () => {
        // Move requests to root
        setRequests(prev => prev.map(r => r.folderId === folderId ? { ...r, folderId: null } : r))
        // Delete folder
        deleteFolder(folderId)
      },
      null,
      'default'
    )
  }

  const handleToggleFolder = (folderId) => {
    toggleFolder(folderId)
  }

  const handleSave = async () => {
    const newRequest = {
      ...activeRequest,
      id: activeRequest.id || Date.now().toString()
    }

    if (activeRequest.id) {
      setRequests(prev => prev.map(r => r.id === activeRequest.id ? newRequest : r))
    } else {
      setRequests(prev => [...prev, newRequest])
    }

    setActiveRequest(newRequest)
    showAlert('Success', 'Request saved!', 'OK', 'success')
  }

  const handleDelete = async (id) => {
    if (!id) return
    showConfirm(
      'Delete Request',
      'Can\'t be undone.',
      () => {
        setRequests(prev => prev.filter(r => r.id !== id))
        if (activeRequest.id === id) {
          handleNewRequest()
        }
      },
      null,
      'destructive'
    )
  }

  const handleSelectHistoryItem = (item) => {
    setActiveRequest({
      ...item,
      id: "",
      name: item.name || "History Request"
    })
    setWebStatus(item.response ? "Loaded from history" : "")
    setWebResponseTime(null)
  }

  const handleSend = async () => {
    setWebLoading(true)
    setWebStatus("Sending...")
    setWebResponseTime(null)
    const startTime = performance.now()

    const getResponseTime = () => Math.round(performance.now() - startTime)

    try {
      const varsMap = parseVariables(variables)
      const { url, method, headers, body } = prepareRequest(activeRequest, varsMap)

      addToHistory({ ...activeRequest, url })

      const response = await sendProxyRequest({ method, url, headers, body })
      const { response: responseData, responseHeaders, responseType, status: statusText } = await processResponse(response)

      setWebResponseTime(getResponseTime())
      setActiveRequest(prev => ({
        ...prev,
        response: responseData,
        responseHeaders,
        responseType
      }))
      setWebStatus(statusText)
    } catch (e) {
      setWebResponseTime(getResponseTime())
      setActiveRequest(prev => ({
        ...prev,
        response: "Error: " + e.message,
        responseType: "text"
      }))
      setWebStatus("Error")
    } finally {
      setWebLoading(false)
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
    openCodeDialog(generated)
  }

  const handleSaveVars = async () => {
    // Validate before saving
    const validation = validateEnvVariables(variables)
    if (!validation.valid) {
      showAlert('Validation Error', validation.error, 'OK', 'warning')
      return
    }

    // Web version persists to localStorage via useEffect (line 70-75)
    showAlert('Success', 'Variables saved!', 'OK', 'success')
  }

  const handleImport = (importData) => {
    if (importData.requests) {
      setRequests(importData.requests)
    }
    if (importData.folders) {
      setFolders(importData.folders)
    }
    if (importData.variables) {
      setVariables(JSON.stringify(importData.variables, null, 2))
    }
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K - Open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openCommandPalette()
      }
      // Ctrl/Cmd + N - New request
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNewRequest(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openCommandPalette])

  // Command palette handler
  const handleCommand = (action) => {
    switch (action) {
      case 'newRequest':
        handleNewRequest(null)
        break
      case 'saveRequest':
        handleSave()
        break
      case 'newFolder':
        handleCreateFolder()
        break
      case 'export':
        openImportDialog()
        break
      case 'import':
        openImportDialog()
        break
      case 'reset':
        showConfirm(
          'Reset App',
          'Clear all data? This cannot be undone.',
          () => {
            resetState()
            showAlert('Success', 'Application state cleared.', 'OK', 'success')
          },
          null,
          'destructive'
        )
        break
    }
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
            Import
          </Button>
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
            onClick={() => {
              showConfirm(
                'Reset App',
                'Clear all data?',
                () => {
                  resetState()
                  showAlert('Success', 'Cleared!', 'OK', 'success')
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
          folders={folders}
          requestHistory={requestHistory}
          activeRequest={activeRequest}
          onSelectRequest={handleSelectRequest}
          onSelectHistoryItem={handleSelectHistoryItem}
          onDeleteHistoryItem={deleteHistoryItem}
          onClearHistory={clearHistory}
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
              response={activeRequest.response}
              responseStatus={status}
              responseHeaders={activeRequest.responseHeaders}
              EditorComponent={MonacoEditor}
              defaultTab={activeRequestTab || 'body'}
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

        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          {codeDialogOpen && codeSnippets && (
            <CodeSnippetDialog
              snippets={codeSnippets}
              onClose={closeCodeDialog}
            />
          )}
        </Suspense>

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

        {/* Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={closeCommandPalette}
          onCommand={handleCommand}
        />
      </div>
    </div>
  )
}

export default WebApp
