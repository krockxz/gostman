import { useState, useEffect, useCallback } from 'react'
import { SendRequest, GetRequests, SaveRequest, DeleteRequest, GetVariables, SaveVariables } from "../wailsjs/go/main/App"
import { Sidebar } from "./components/Sidebar"
import { RequestBar } from "./components/RequestBar"
import { ResponsePanel } from "./components/ResponsePanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { MonacoEditor } from "./components/MonacoEditor"
import { TabBar } from "./components/TabBar"
import { Button } from "./components/ui/button"
import { ScrollArea } from "./components/ui/scroll-area"
import { Braces, Hash, Heading1, FolderOpen } from "lucide-react"

const DEFAULT_REQUEST = {
  id: "",
  name: "New Request",
  method: "GET",
  url: "",
  headers: "{}",
  body: "",
  queryParams: "{}",
  response: ""
}

let nextTabId = 1

function App() {
  const [requests, setRequests] = useState([])
  const [tabs, setTabs] = useState([{ id: 'tab-1', request: { ...DEFAULT_REQUEST }, status: '', loading: false }])
  const [activeTabId, setActiveTabId] = useState('tab-1')
  const [variables, setVariables] = useState("{}")

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  // -- Data Loading --

  const fetchInitialData = useCallback(async () => {
    try {
      const [reqs, vars] = await Promise.all([GetRequests(), GetVariables()])
      setRequests(reqs || [])
      setVariables(vars || "{}")
    } catch (e) {
      console.error("Failed to load data:", e)
    }
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const refreshRequests = async () => {
    const reqs = await GetRequests()
    setRequests(reqs || [])
  }

  // -- Tab Management --

  const updateActiveTab = (updates) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId ? { ...tab, ...updates } : tab
    ))
  }

  const updateActiveRequest = (updates) => {
    updateActiveTab({ request: { ...activeTab.request, ...updates } })
  }

  const updateField = (field, value) => {
    updateActiveRequest({ [field]: value })
  }

  const handleNewTab = () => {
    nextTabId++
    const newTab = {
      id: `tab-${nextTabId}`,
      request: { ...DEFAULT_REQUEST },
      status: '',
      loading: false
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }

  const handleCloseTab = (tabId) => {
    if (tabs.length === 1) return // Always keep at least one tab

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        const closedIndex = prev.findIndex(t => t.id === tabId)
        const newActiveTab = newTabs[Math.max(0, closedIndex - 1)]
        setActiveTabId(newActiveTab.id)
      }
      return newTabs
    })
  }

  const handleSelectRequest = (req) => {
    updateActiveTab({ request: req, status: '' })
  }

  const handleNewRequest = () => {
    handleNewTab()
  }

  const handleSave = async () => {
    try {
      const msg = await SaveRequest(activeTab.request)
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
        handleNewRequest()
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleSend = async () => {
    updateActiveTab({ loading: true, status: 'Sending...' })
    try {
      const resp = await SendRequest(
        activeTab.request.method,
        activeTab.request.url,
        activeTab.request.headers,
        activeTab.request.body,
        activeTab.request.queryParams
      )
      updateActiveTab({
        request: { ...activeTab.request, response: resp.body },
        status: resp.status,
        loading: false
      })
    } catch (e) {
      updateActiveTab({
        request: { ...activeTab.request, response: "Error: " + e },
        status: "Error",
        loading: false
      })
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-muted/10 backdrop-blur-md px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground font-bold shadow-lg shadow-primary/25">
            <span className="text-lg">G</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Gostman</h1>
            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">HTTP Client</p>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          requests={requests}
          activeRequest={activeTab.request}
          onSelectRequest={handleSelectRequest}
          onNewRequest={handleNewRequest}
          onDeleteRequest={handleDelete}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tab Bar */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTabId}
            onTabClose={handleCloseTab}
            onNewTab={handleNewTab}
          />

          <RequestBar
            activeRequest={activeTab.request}
            onMethodChange={(val) => updateField('method', val)}
            onUrlChange={(val) => updateField('url', val)}
            onNameChange={(val) => updateField('name', val)}
            onSend={handleSend}
            onSave={handleSave}
            loading={activeTab.loading}
          />

          <div className="flex flex-1 flex-col overflow-hidden">
            <Tabs defaultValue="body" className="flex flex-1 flex-col">
              <div className="border-b bg-muted/10 px-4 backdrop-blur-sm">
                <TabsList>
                  <TabsTrigger value="body" icon={Braces}>Body</TabsTrigger>
                  <TabsTrigger value="params" icon={Hash}>Params</TabsTrigger>
                  <TabsTrigger value="headers" icon={Heading1}>Headers</TabsTrigger>
                  <TabsTrigger value="vars" icon={FolderOpen}>Env Vars</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="body" className="h-full p-0 m-0">
                  <MonacoEditor
                    value={activeTab.request.body}
                    onChange={(e) => updateField('body', e.target.value)}
                    language="json"
                    height="100%"
                    placeholder='{\n  "key": "value"\n}'
                  />
                </TabsContent>

                <TabsContent value="params" className="h-full p-0 m-0">
                  <MonacoEditor
                    value={activeTab.request.queryParams}
                    onChange={(e) => updateField('queryParams', e.target.value)}
                    language="json"
                    height="100%"
                    placeholder='{\n  "query": "param"\n}'
                  />
                </TabsContent>

                <TabsContent value="headers" className="h-full p-0 m-0">
                  <MonacoEditor
                    value={activeTab.request.headers}
                    onChange={(e) => updateField('headers', e.target.value)}
                    language="json"
                    height="100%"
                    placeholder='{\n  "Content-Type": "application/json"\n}'
                  />
                </TabsContent>

                <TabsContent value="vars" className="h-full p-0 m-0">
                  <div className="flex h-full flex-col">
                    <div className="flex-1">
                      <MonacoEditor
                        value={variables}
                        onChange={(e) => setVariables(e.target.value)}
                        language="json"
                        height="100%"
                        placeholder='{\n  "base_url": "https://api.example.com"\n}'
                      />
                    </div>
                    <div className="border-t bg-muted/10 p-4">
                      <div className="mb-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <FolderOpen className="h-4 w-4" />
                          Environment Variables
                        </label>
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          Define reusable variables with double curly braces syntax.
                        </p>
                      </div>
                      <Button onClick={handleSaveVars} size="sm" className="gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Save Variables
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <ResponsePanel response={activeTab.request.response} status={activeTab.status} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
