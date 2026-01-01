import React, { lazy, Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ScrollArea } from "./ui/scroll-area"
import { Button } from "./ui/button"
import { Braces, Hash, Heading1, FolderOpen, FlaskConical, Zap, Radio } from "lucide-react"
import { TestScriptsPanel } from "./TestScriptsPanel"
// Lazy load panels
const GraphQLPanel = lazy(() => import("./GraphQLPanel").then(module => ({ default: module.GraphQLPanel })))
const WebSocketPanel = lazy(() => import("./WebSocketPanel").then(module => ({ default: module.WebSocketPanel })))

export function RequestTabs({
    activeRequest,
    onUpdateField,
    variables,
    onUpdateVariables,
    onSaveVars,
    response,
    responseStatus,
    responseHeaders,
    EditorComponent
}) {
    return (
        <Tabs defaultValue="body" className="flex flex-1 flex-col">
            <div className="border-b bg-muted/10 px-4 backdrop-blur-sm">
                <TabsList>
                    <TabsTrigger value="body" icon={Braces}>Body</TabsTrigger>
                    <TabsTrigger value="graphql" icon={Zap}>GraphQL</TabsTrigger>
                    <TabsTrigger value="websocket" icon={Radio}>WebSocket</TabsTrigger>
                    <TabsTrigger value="params" icon={Hash}>Params</TabsTrigger>
                    <TabsTrigger value="headers" icon={Heading1}>Headers</TabsTrigger>
                    <TabsTrigger value="vars" icon={FolderOpen}>Env Vars</TabsTrigger>
                    <TabsTrigger value="test" icon={FlaskConical}>Extract</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
                <TabsContent value="body" className="h-full p-0 m-0">
                    <div className="h-full">
                        {/* Wrapper div might be needed depending on EditorComponent's height behavior */}
                        <EditorComponent
                            value={activeRequest.body}
                            onChange={(e) => onUpdateField('body', e.target.value)}
                            language="json"
                            placeholder='{\n  "key": "value"\n}'
                            className="min-h-[300px] font-mono text-sm" // Class for Textarea
                            height="100%" // Prop for Monaco
                        />
                    </div>
                </TabsContent>

                <TabsContent value="graphql" className="h-full p-0 m-0">
                    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading GraphQL Module...</div>}>
                        <GraphQLPanel
                            query={activeRequest.graphqlQuery || activeRequest.body || ''}
                            variables={activeRequest.graphqlVariables || '{}'}
                            onQueryChange={(val) => onUpdateField('graphqlQuery', val)}
                            onVariablesChange={(val) => onUpdateField('graphqlVariables', val)}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="websocket" className="h-full p-0 m-0">
                    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading WebSocket Module...</div>}>
                        <WebSocketPanel
                            url={activeRequest.wsUrl || activeRequest.url || ''}
                            onUrlChange={(val) => onUpdateField('wsUrl', val)}
                            headers={activeRequest.headers || '{}'}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="params" className="h-full p-0 m-0">
                    <div className="h-full">
                        <EditorComponent
                            value={activeRequest.queryParams}
                            onChange={(e) => onUpdateField('queryParams', e.target.value)}
                            language="json"
                            placeholder='{\n  "query": "param",\n  "filter": "value"\n}'
                            className="min-h-[300px] font-mono text-sm"
                            height="100%"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="headers" className="h-full p-0 m-0">
                    <div className="h-full">
                        <EditorComponent
                            value={activeRequest.headers}
                            onChange={(e) => onUpdateField('headers', e.target.value)}
                            language="json"
                            placeholder='{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'
                            className="min-h-[300px] font-mono text-sm"
                            height="100%"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="vars" className="h-full p-0 m-0">
                    {/* Vars tab is slightly complex due to the extra UI elements */}
                    {/* If EditorComponent is Textarea (WebApp), likely wrapped in ScrollArea?? */}
                    {/* Actually App.jsx uses Monaco directly in div. WebApp uses ScrollArea wrapper for Textarea. */}
                    {/* We might need to conditionalize the container or pass a 'Container' prop? */}
                    {/* Or better, let's keep the ScrollArea only if it's Textarea? Or just always put one? */}
                    {/* Monaco handles its own scrolling. Textarea needs one. */}

                    {/* Compromise: We'll assume the EditorComponent handles its specific needs or we pass a wrapper.
               BUT WebApp.jsx has "Environment Variables" label and explanation TEXT that App.jsx DOESN'T (exact layout differs).
               App.jsx has "Environment Variables" label at the BOTTOM in a separate div.
               WebApp.jsx has it at the TOP.
           */}
                    {/* Divergence detected. Let's aim for common ground or allow children/render props for vars? 
               Or simply standardize the UI? 
               Standardizing is better for "Clean Code".
               Let's go with the App.jsx layout (Editor takes most space, specific controls in a sidebar or bottom).
               Actually, let's look at `App.jsx` again (Step 75 lines 322-349).
               It splits view: Editor on top, Controls on bottom.
               WebApp.jsx (Step 74 lines 329-353) puts controls/labels on top, then Textarea.
               
               I will unify them to the `App.jsx` style (Editor main, controls bottom) as it seems more "IDE-like".
           */}
                    <div className="flex h-full flex-col">
                        <div className="flex-1 overflow-hidden relative">
                            <EditorComponent
                                value={variables}
                                onChange={(e) => onUpdateVariables(e.target.value)}
                                language="json"
                                placeholder='{\n  "base_url": "https://api.example.com"\n}'
                                className="min-h-[200px] font-mono text-sm h-full resize-none p-4 bg-transparent border-0 focus-visible:ring-0" // Styling for Textarea to fill
                                height="100%"
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
                            <Button onClick={onSaveVars} size="sm" className="gap-2">
                                <FolderOpen className="h-4 w-4" />
                                Save Variables
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="test" className="h-full p-0 m-0">
                    <TestScriptsPanel
                        response={activeRequest.response}
                        responseStatus={null}
                        responseHeaders={activeRequest.responseHeaders}
                        variables={variables}
                        onUpdateVariables={onUpdateVariables}
                    />
                </TabsContent>
            </div>
        </Tabs>
    )
}
