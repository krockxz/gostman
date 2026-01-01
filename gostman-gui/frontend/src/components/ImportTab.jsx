import React, { useState, useRef } from "react"
import {
    Upload, FileJson, FolderOpen,
    Check, AlertCircle
} from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
    parsePostmanCollection,
    detectImportFormat
} from "../lib/importExport"

const IMPORT_FORMATS = [
    { id: 'postman', label: 'Postman', icon: FileJson, description: 'Import Postman collections' },
    { id: 'gostman', label: 'Gostman', icon: FolderOpen, description: 'Import Gostman backup' }
]

export function ImportTab({ onImport, onClose }) {
    const [importJson, setImportJson] = useState('')
    const [importResult, setImportResult] = useState(null)
    const fileInputRef = useRef(null)

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

    return (
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

            <div className="flex items-center gap-2 my-4">
                <div className="h-px bg-border/50 flex-1" />
                <span className="text-xs text-muted-foreground uppercase">Or paste content</span>
                <div className="h-px bg-border/50 flex-1" />
            </div>

            <div className="space-y-2">
                <textarea
                    className="flex min-h-[150px] w-full rounded-md border border-border bg-background/50 backdrop-blur-sm px-3 py-2 text-sm shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono resize-none"
                    placeholder="Paste Postman collection or Gostman export JSON here..."
                    value={importJson}
                    onChange={(e) => {
                        setImportJson(e.target.value)
                        if (e.target.value.trim()) {
                            processImport(e.target.value)
                        } else {
                            setImportResult(null)
                        }
                    }}
                />
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
    )
}
