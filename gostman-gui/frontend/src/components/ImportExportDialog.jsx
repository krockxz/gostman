import React, { useState, useEffect, useRef } from "react"
import {
  X, Upload, Download, FileJson, FileText, FolderOpen,
  Check, AlertCircle, Copy, FileCode
} from "lucide-react"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Badge } from "./ui/badge"
import {
  parsePostmanCollection,
  exportToOpenAPIJSON,
  exportToOpenAPIYAML,
  exportToPostman,
  exportToGostman,
  exportToMarkdown,
  detectImportFormat
} from "../lib/importExport"

const IMPORT_FORMATS = [
  { id: 'postman', label: 'Postman', icon: FileJson, description: 'Import Postman collections' },
  { id: 'gostman', label: 'Gostman', icon: FolderOpen, description: 'Import Gostman backup' }
]

const EXPORT_FORMATS = [
  { id: 'openapi-json', label: 'OpenAPI JSON', icon: FileCode, description: 'OpenAPI 3.0 spec (JSON)' },
  { id: 'openapi-yaml', label: 'OpenAPI YAML', icon: FileCode, description: 'OpenAPI 3.0 spec (YAML)' },
  { id: 'postman', label: 'Postman', icon: FileJson, description: 'Postman collection v2.1' },
  { id: 'markdown', label: 'Markdown', icon: FileText, description: 'API documentation' },
  { id: 'gostman', label: 'Gostman', icon: FolderOpen, description: 'Gostman backup (JSON)' }
]

export function ImportExportDialog({
  requests = [],
  folders = [],
  variables = {},
  onImport,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('import')
  const [importJson, setImportJson] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [selectedExportFormat, setSelectedExportFormat] = useState('openapi-json')
  const [exportPreview, setExportPreview] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)

  // Update export preview when format changes
  useEffect(() => {
    generateExport()
  }, [selectedExportFormat, requests, folders, variables])

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setImportJson(content)
        processImport(content)
      }
    }
    reader.readAsText(file)
  }

  const processImport = (jsonString) => {
    try {
      const format = detectImportFormat(jsonString)

      if (format === 'postman') {
        const result = parsePostmanCollection(jsonString)
        if (result.success) {
          setImportResult({
            success: true,
            format: 'postman',
            requestsCount: result.requests.length,
            foldersCount: result.folders.length,
            data: result
          })
        } else {
          setImportResult({
            success: false,
            error: result.error
          })
        }
      } else if (format === 'gostman') {
        try {
          const data = JSON.parse(jsonString)
          setImportResult({
            success: true,
            format: 'gostman',
            requestsCount: data.gostman?.requests?.length || 0,
            foldersCount: data.gostman?.folders?.length || 0,
            data
          })
        } catch (err) {
          setImportResult({
            success: false,
            error: err.message
          })
        }
      } else if (format === 'unknown') {
        setImportResult({
          success: false,
          error: 'Unknown format. Please upload a valid Postman collection or Gostman export.'
        })
      } else {
        setImportResult({
          success: false,
          error: `Format "${format}" is not supported yet.`
        })
      }
    } catch (err) {
      setImportResult({
        success: false,
        error: err.message
      })
    }
  }

  const handleImport = () => {
    if (importResult?.success && onImport) {
      onImport(importResult.data)
      onClose()
    }
  }

  const generateExport = () => {
    try {
      switch (selectedExportFormat) {
        case 'openapi-json':
          setExportPreview(exportToOpenAPIJSON(requests, {
            title: 'Gostman API Collection',
            version: '1.0.0'
          }))
          break
        case 'openapi-yaml':
          setExportPreview(exportToOpenAPIYAML(requests, {
            title: 'Gostman API Collection',
            version: '1.0.0'
          }))
          break
        case 'postman':
          setExportPreview(JSON.stringify(exportToPostman(requests, folders, {
            name: 'Gostman Collection'
          }), null, 2))
          break
        case 'markdown':
          setExportPreview(exportToMarkdown(requests, {
            title: 'API Documentation'
          }))
          break
        case 'gostman':
          setExportPreview(JSON.stringify(exportToGostman(requests, folders, variables), null, 2))
          break
        default:
          setExportPreview('')
      }
    } catch (err) {
      setExportPreview(`Error generating export: ${err.message}`)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportPreview)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([exportPreview], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    const extensions = {
      'openapi-json': 'json',
      'openapi-yaml': 'yaml',
      'postman': 'json',
      'markdown': 'md',
      'gostman': 'json'
    }
    a.download = `gostman-export.${extensions[selectedExportFormat] || 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatLabel = EXPORT_FORMATS.find(f => f.id === selectedExportFormat)?.label || 'Export'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-background to-muted/20 border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20">
              {activeTab === 'import' ? <Upload className="h-4.5 w-4.5" /> : <Download className="h-4.5 w-4.5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {activeTab === 'import' ? 'Import Collection' : 'Export Collection'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {activeTab === 'import' ? 'Import from Postman or Gostman' : 'Export to various formats'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="import" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Upload className="h-3.5 w-3.5" />
                Import
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Download className="h-3.5 w-3.5" />
                Export
              </TabsTrigger>
            </TabsList>

            {/* Import Tab */}
            <TabsContent value="import" className="mt-0 animate-in fade-in-50 duration-200">
              <div className="space-y-6">
                {/* File Upload */}
                <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop a file here or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports Postman collections and Gostman exports</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      Choose File
                    </Button>
                  </div>
                </div>

                {/* Import Result */}
                {importResult && (
                  <div className={`
                    rounded-xl p-4 border
                    ${importResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20'
                      : 'bg-destructive/10 border-destructive/20'
                    }
                  `}>
                    <div className="flex items-start gap-3">
                      {importResult.success ? (
                        <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        {importResult.success ? (
                          <div>
                            <p className="text-sm font-medium text-emerald-500">
                              Successfully imported {importResult.format} collection
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {importResult.requestsCount} requests
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {importResult.foldersCount} folders
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-destructive">{importResult.error}</p>
                        )}
                      </div>
                      {importResult.success && (
                        <Button size="sm" onClick={handleImport} className="shrink-0">
                          Confirm Import
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Format Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {IMPORT_FORMATS.map((format) => {
                    const Icon = format.icon
                    return (
                      <div
                        key={format.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">{format.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{format.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="mt-0 animate-in fade-in-50 duration-200">
              <div className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/50">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{requests.length} requests</span>
                  </div>
                  <div className="w-px h-4 bg-border/50" />
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{folders.length} folders</span>
                  </div>
                </div>

                {/* Format Selection */}
                <div className="grid grid-cols-5 gap-2">
                  {EXPORT_FORMATS.map((format) => {
                    const Icon = format.icon
                    const isActive = selectedExportFormat === format.id
                    return (
                      <button
                        key={format.id}
                        onClick={() => setSelectedExportFormat(format.id)}
                        className={`
                          flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                          ${isActive
                            ? 'bg-primary/10 border-primary/30 shadow-sm'
                            : 'bg-muted/10 border-border/30 hover:border-border/50'
                          }
                        `}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-[10px] font-medium text-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          {format.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Preview */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl" />
                  <pre className="relative overflow-x-auto rounded-xl p-4 text-sm leading-relaxed border border-white/5 shadow-xl max-h-80">
                    <code className="font-mono text-slate-300 whitespace-pre-wrap">{exportPreview || '// Export preview will appear here'}</code>
                  </pre>

                  {/* Action buttons */}
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleCopy}
                      variant="secondary"
                      className="gap-1.5 shadow-lg bg-muted/80 backdrop-blur-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span className="text-xs">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-xs">Copy</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDownload}
                      className="gap-1.5 shadow-lg bg-primary hover:bg-primary/90"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="text-xs">Download</span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/50 font-mono text-[10px]">Esc</kbd> to close
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
