import { useState, useEffect } from 'react'
import { SendRequest, GetRequests, SaveRequest, DeleteRequest, GetVariables, SaveVariables } from "../wailsjs/go/main/App"
import { Sidebar } from "./components/Sidebar"
import { RequestBar } from "./components/RequestBar"
import { ResponsePanel } from "./components/ResponsePanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Textarea } from "./components/ui/textarea"
import { Button } from "./components/ui/button"
import { ScrollArea } from "./components/ui/scroll-area"
import { Braces, Hash, Heading1, FolderOpen, Loader2 } from "lucide-react"

function App() {
  const [requests, setRequests] = useState([])
  const [activeRequest, setActiveRequest] = useState({
    id: "",
    name: "New Request",
    method: "GET",
    url: "",
    headers: "{}",
    body: "",
    queryParams: "{}",
    response: ""
  })
  const [variables, setVariables] = useState("{}")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRequests()
    loadVariables()
  }, [])

  const loadRequests = async () => {
    const reqs = await GetRequests()
    setRequests(reqs || [])
  }

  const loadVariables = async () => {
    const vars = await GetVariables()
    setVariables(vars || "{}")
  }

  const handleSelectRequest = (req) => {
    setActiveRequest(req)
    setStatus("")
  }

  const handleNewRequest = () => {
    setActiveRequest({
      id: "",
      name: "New Request",
      method: "GET",
      url: "",
      headers: "{}",
      body: "",
      queryParams: "{}",
      response: ""
    })
    setStatus("")
  }

  const handleSave = async () => {
    const msg = await SaveRequest(activeRequest)
    alert(msg)
    loadRequests()
  }

  const handleDelete = async (id) => {
    if (!id) return
    if (confirm("Are you sure you want to delete this request?")) {
      await DeleteRequest(id)
      loadRequests()
      handleNewRequest()
    }
  }

  const handleSend = async () => {
    setLoading(true)
    setStatus("Sending...")
    try {
      const resp = await SendRequest(
        activeRequest.method,
        activeRequest.url,
        activeRequest.headers,
        activeRequest.body,
        activeRequest.queryParams
      )
      setActiveRequest({ ...activeRequest, response: resp.body })
      setStatus(resp.status)
    } catch (e) {
      setActiveRequest({ ...activeRequest, response: "Error: " + e })
      setStatus("Error")
    }
    setLoading(false)
  }

  const saveVars = async () => {
    const msg = await SaveVariables(variables)
    alert(msg)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Header with glass morphism */}
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          requests={requests}
          activeRequest={activeRequest}
          onSelectRequest={handleSelectRequest}
          onNewRequest={handleNewRequest}
          onDeleteRequest={handleDelete}
        />

        {/* Main Panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Request Bar */}
          <RequestBar
            activeRequest={activeRequest}
            onMethodChange={(method) => setActiveRequest({ ...activeRequest, method })}
            onUrlChange={(url) => setActiveRequest({ ...activeRequest, url })}
            onNameChange={(name) => setActiveRequest({ ...activeRequest, name })}
            onSend={handleSend}
            onSave={handleSave}
            loading={loading}
          />

          {/* Tabs Content */}
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
                  <ScrollArea className="h-full scrollbar-thin">
                    <div className="p-4">
                      <Textarea
                        value={activeRequest.body}
                        onChange={(e) => setActiveRequest({ ...activeRequest, body: e.target.value })}
                        placeholder='{\n  "key": "value"\n}'
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="params" className="h-full p-0 m-0">
                  <ScrollArea className="h-full scrollbar-thin">
                    <div className="p-4">
                      <Textarea
                        value={activeRequest.queryParams}
                        onChange={(e) => setActiveRequest({ ...activeRequest, queryParams: e.target.value })}
                        placeholder='{\n  "query": "param",\n  "filter": "value"\n}'
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="headers" className="h-full p-0 m-0">
                  <ScrollArea className="h-full scrollbar-thin">
                    <div className="p-4">
                      <Textarea
                        value={activeRequest.headers}
                        onChange={(e) => setActiveRequest({ ...activeRequest, headers: e.target.value })}
                        placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="vars" className="h-full p-0 m-0">
                  <ScrollArea className="h-full scrollbar-thin">
                    <div className="space-y-4 p-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <FolderOpen className="h-4 w-4" />
                          Environment Variables
                        </label>
                        <p className="text-xs text-muted-foreground/60">
                          Define reusable variables like base URLs, API keys, or common headers.
                        </p>
                        <Textarea
                          value={variables}
                          onChange={(e) => setVariables(e.target.value)}
                          placeholder='{\n  "base_url": "https://api.example.com",\n  "api_key": "your-api-key-here"\n}'
                          className="min-h-[200px] font-mono text-sm"
                        />
                      </div>
                      <Button onClick={saveVars} size="sm" className="gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Save Variables
                      </Button>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>

            {/* Response Panel */}
            <ResponsePanel response={activeRequest.response} status={status} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
