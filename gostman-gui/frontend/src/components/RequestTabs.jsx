import React, { lazy, Suspense, useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ScrollArea } from "./ui/scroll-area"
import { Button } from "./ui/button"
import { Braces, Hash, Heading1, FolderOpen, FlaskConical, Zap, Radio, AlertCircle, CheckCircle2 } from "lucide-react"
import { TestScriptsPanel } from "./TestScriptsPanel"
import { validateEnvVariables, formatJSONError } from "../lib/validation"
import { isWebSocketURL } from "./WebSocketPanel"
// Lazy load panels
const GraphQLPanel = lazy(() => import("./GraphQLPanel").then(module => ({ default: module.GraphQLPanel, formatGraphQLRequest })))
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
    EditorComponent,
    defaultTab = 'body'
}) {
    // Environment variable validation state
    const [envVarValidation, setEnvVarValidation] = useState({ valid: true, error: null })

    // Internal tab state (can be controlled externally via defaultTab changes)
    const [activeTab, setActiveTab] = useState(defaultTab)

    // Update internal tab when defaultTab changes (external control)
    useEffect(() => {
        setActiveTab(defaultTab)
    }, [defaultTab])

    // Auto-detect WebSocket URL and switch tab
    useEffect(() => {
        const url = activeRequest?.url || ''
        if (isWebSocketURL(url) && activeTab !== 'websocket') {
            setActiveTab('websocket')
        }
    }, [activeRequest?.url])

    // Validate environment variables when they change
    useEffect(() => {
        const result = validateEnvVariables(variables)
        setEnvVarValidation(result)
    }, [variables])

    // Sync GraphQL data to body when GraphQL tab is active
    // This ensures that the Send button sends the correctly formatted GraphQL request
    useEffect(() => {
        if (activeTab === 'graphql') {
            const query = activeRequest.graphqlQuery || activeRequest.body || ''
            const variables = activeRequest.graphqlVariables || '{}'

            // Dynamically import formatGraphQLRequest to avoid circular dependency
            import("./GraphQLPanel").then(module => {
                const formatted = module.formatGraphQLRequest(query, variables)
                if (formatted.body) {
                    onUpdateField('body', formatted.body)
                }
                if (formatted.headers) {
                    // Ensure Content-Type is set for GraphQL
                    try {
                        const currentHeaders = JSON.parse(activeRequest.headers || '{}')
                        const mergedHeaders = { ...currentHeaders, ...formatted.headers }
                        onUpdateField('headers', JSON.stringify(mergedHeaders, null, 2))
                    } catch (e) {
                        // If headers are invalid JSON, just set the GraphQL headers
                        onUpdateField('headers', JSON.stringify(formatted.headers, null, 2))
                    }
                }
            })
        }
    }, [activeTab, activeRequest.graphqlQuery, activeRequest.graphqlVariables])

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
            <div className="border-b border-border/60 bg-muted/10 px-4 backdrop-blur-md">
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
                <TabsContent value="body" className="h-full p-0" noMargin>
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

                <TabsContent value="graphql" className="h-full p-0" noMargin>
                    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading GraphQL Module...</div>}>
                        <GraphQLPanel
                            query={activeRequest.graphqlQuery || activeRequest.body || ''}
                            variables={activeRequest.graphqlVariables || '{}'}
                            onQueryChange={(val) => onUpdateField('graphqlQuery', val)}
                            onVariablesChange={(val) => onUpdateField('graphqlVariables', val)}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="websocket" className="h-full p-0" noMargin>
                    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading WebSocket Module...</div>}>
                        <WebSocketPanel
                            url={activeRequest.wsUrl || activeRequest.url || ''}
                            onUrlChange={(val) => onUpdateField('wsUrl', val)}
                            headers={activeRequest.headers || '{}'}
                        />
                    </Suspense>
                </TabsContent>

                <TabsContent value="params" className="h-full p-0" noMargin>
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

                <TabsContent value="headers" className="h-full p-0" noMargin>
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

                <TabsContent value="vars" className="h-full p-0" noMargin>
                    <div className="flex h-full flex-col">
                        <div className="flex-1 overflow-hidden relative">
                            <EditorComponent
                                value={variables}
                                onChange={(e) => onUpdateVariables(e.target.value)}
                                language="json"
                                placeholder='{\n  "base_url": "https://api.example.com"\n}'
                                className="min-h-[200px] font-mono text-sm h-full resize-none p-4 bg-transparent border-0 focus-visible:ring-0"
                                height="100%"
                            />
                        </div>

                        {/* Validation status bar */}
                        <div className={`px-4 py-2 flex items-center gap-2 text-xs border-t ${
                            envVarValidation.error ? 'bg-destructive/10 border-destructive/20' : 'bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                            {envVarValidation.error ? (
                                <>
                                    <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                                    <span className="text-destructive truncate">{formatJSONError(envVarValidation)}</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Valid JSON</span>
                                </>
                            )}
                        </div>

                        <div className="border-t border-border/60 bg-muted/10 p-4">
                            <div className="mb-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <FolderOpen className="h-4 w-4" />
                                    Environment Variables
                                </label>
                                <p className="mt-1 text-xs text-muted-foreground/60">
                                    Define reusable variables with double curly braces syntax.
                                </p>
                            </div>
                            <Button
                                onClick={onSaveVars}
                                size="sm"
                                className="gap-2"
                                disabled={!!envVarValidation.error}
                            >
                                <FolderOpen className="h-4 w-4" />
                                Save Variables
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="test" className="h-full p-0" noMargin>
                    <TestScriptsPanel
                        response={activeRequest.response}
                        responseStatus={null}
                        responseHeaders={activeRequest.responseHeaders}
                        variables={variables}
                        onVariablesChange={onUpdateVariables}
                        onSaveVariables={onSaveVars}
                    />
                </TabsContent>
            </div>
        </Tabs>
    )
}
