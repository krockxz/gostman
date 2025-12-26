import { useState } from "react"
import { LandingPage } from "./components/LandingPage"
import { Sidebar } from "./components/Sidebar"
import { RequestBar } from "./components/RequestBar"
import { ResponsePanel } from "./components/ResponsePanel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Textarea } from "./components/ui/textarea"
import { Button } from "./components/ui/button"
import { ScrollArea } from "./components/ui/scroll-area"
import { Braces, Hash, Heading1, FolderOpen, ArrowLeft } from "lucide-react"

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

// Mock data for web version (replace with actual API calls)
const mockRequests = [
  {
    id: "1",
    name: "Example GET Request",
    method: "GET",
    url: "https://api.example.com/users",
    headers: '{"Content-Type": "application/json"}',
    body: "",
    queryParams: '{}',
    response: '{"status": "success", "data": []}'
  }
]

function WebApp() {
  const [showLanding, setShowLanding] = useState(true)
  const [requests, setRequests] = useState(mockRequests)
  const [activeRequest, setActiveRequest] = useState(DEFAULT_REQUEST)
  const [variables, setVariables] = useState("{}")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSelectRequest = (req) => {
    setActiveRequest(req)
    setStatus("")
  }

  const handleNewRequest = () => {
    setActiveRequest(DEFAULT_REQUEST)
    setStatus("")
  }

  const handleSave = async () => {
    // Web version - save to localStorage or API
    alert("Request saved! (Web version)")
  }

  const handleDelete = async (id) => {
    if (!id) return
    if (confirm("Are you sure you want to delete this request?")) {
      setRequests(requests.filter(r => r.id !== id))
      handleNewRequest()
    }
  }

  const handleSend = async () => {
    setLoading(true)
    setStatus("Sending...")
    // Web version - make actual API call via fetch
    try {
      const response = await fetch(activeRequest.url, {
        method: activeRequest.method,
        headers: JSON.parse(activeRequest.headers || "{}"),
        body: ["POST", "PUT", "PATCH"].includes(activeRequest.method)
          ? activeRequest.body
          : undefined
      })
      const text = await response.text()
      setActiveRequest(prev => ({ ...prev, response: text }))
      setStatus(`${response.status} ${response.statusText}`)
    } catch (e) {
      setActiveRequest(prev => ({ ...prev, response: "Error: " + e.message }))
      setStatus("Error")
    } finally {
      setLoading(false)
    }
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToLanding}
            className="h-8 w-8"
            title="Back to landing page"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground font-bold shadow-lg shadow-primary/25">
            <span className="text-lg">G</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Gostman</h1>
            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">Web Version</p>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          requests={requests}
          activeRequest={activeRequest}
          onSelectRequest={handleSelectRequest}
          onNewRequest={handleNewRequest}
          onDeleteRequest={handleDelete}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <RequestBar
            activeRequest={activeRequest}
            onMethodChange={(val) => updateField('method', val)}
            onUrlChange={(val) => updateField('url', val)}
            onNameChange={(val) => updateField('name', val)}
            onSend={handleSend}
            onSave={handleSave}
            loading={loading}
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
                  <ScrollArea className="h-full scrollbar-thin">
                    <div className="p-4">
                      <Textarea
                        value={activeRequest.body}
                        onChange={(e) => updateField('body', e.target.value)}
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
                        onChange={(e) => updateField('queryParams', e.target.value)}
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
                        onChange={(e) => updateField('headers', e.target.value)}
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
                      <Button onClick={handleSaveVars} size="sm" className="gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Save Variables
                      </Button>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>

            <ResponsePanel response={activeRequest.response} status={status} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default WebApp
