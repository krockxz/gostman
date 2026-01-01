import React, { useState, useEffect } from "react"
import { Play, Plus, Trash2, Code2, FolderOpen, Info } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import {
  extractFromResponse,
  extractFromHeaders,
  VARIABLE_TEMPLATES,
  createTestScript
} from "../lib/chaining"

export function TestScriptsPanel({
  response,
  responseStatus,
  responseHeaders,
  variables,
  onVariablesChange,
  onSaveVariables
}) {
  const [extractors, setExtractors] = useState([{ name: '', path: '', scope: 'environment' }])
  const [previewResult, setPreviewResult] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)

  // Update preview when response or extractors change
  useEffect(() => {
    if (response && response.trim()) {
      const results = {}
      extractors.forEach((ext, idx) => {
        if (ext.name && ext.path) {
          let value
          if (ext.path.startsWith('header.')) {
            value = extractFromHeaders(responseHeaders, ext.path)
          } else if (ext.path === 'statusCode' || ext.path === 'status') {
            value = responseStatus || ''
          } else {
            value = extractFromResponse(response, ext.path)
          }
          results[idx] = { name: ext.name, value, found: value !== null }
        }
      })
      setPreviewResult(results)
    } else {
      setPreviewResult(null)
    }
  }, [response, responseStatus, responseHeaders, extractors])

  const addExtractor = () => {
    setExtractors([...extractors, { name: '', path: '', scope: 'environment' }])
  }

  const removeExtractor = (index) => {
    setExtractors(extractors.filter((_, i) => i !== index))
  }

  const updateExtractor = (index, field, value) => {
    const updated = [...extractors]
    updated[index][field] = value
    setExtractors(updated)
  }

  const applyExtractions = () => {
    const extracted = {}

    extractors.forEach((ext) => {
      if (ext.name && ext.path) {
        let value
        if (ext.path.startsWith('header.')) {
          value = extractFromHeaders(responseHeaders, ext.path)
        } else if (ext.path === 'statusCode' || ext.path === 'status') {
          value = responseStatus || ''
        } else {
          value = extractFromResponse(response, ext.path)
        }

        if (value !== null) {
          extracted[ext.name] = value
        }
      }
    })

    // Merge with existing variables
    const existing = typeof variables === 'string' ? JSON.parse(variables || '{}') : variables
    const merged = { ...existing, ...extracted }
    onVariablesChange(JSON.stringify(merged, null, 2))

    // Show success message
    const count = Object.keys(extracted).length
    if (count > 0) {
      alert(`Extracted ${count} variable${count > 1 ? 's' : ''} to environment`)
    }
  }

  const useTemplate = (template) => {
    setExtractors([...extractors, { name: template.name, path: template.path, scope: 'environment' }])
    setShowTemplates(false)
  }

  const generateTestScript = () => {
    const validExtractors = extractors.filter(e => e.name && e.path)
    if (validExtractors.length === 0) return ''

    return validExtractors
      .map(ext => createTestScript(ext.name, ext.path, ext.scope))
      .join('\n')
  }

  const hasResponse = response && response.trim()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Variable Extraction</span>
        </div>
        <div className="flex items-center gap-2">
          {hasResponse && (
            <Badge variant="secondary" className="text-xs">
              Response available
            </Badge>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Extract values from responses and save them as variables for use in other requests.
            Use dot notation for nested values (e.g., <code className="bg-background px-1 rounded">data.user.id</code>).
          </p>
        </div>
      </div>

      {/* Extractors List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {extractors.map((extractor, idx) => (
          <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/10">
            <Input
              placeholder="Variable name"
              value={extractor.name}
              onChange={(e) => updateExtractor(idx, 'name', e.target.value)}
              className="flex-1 h-8 text-sm"
            />
            <Input
              placeholder="Path (e.g., data.id)"
              value={extractor.path}
              onChange={(e) => updateExtractor(idx, 'path', e.target.value)}
              className="flex-1 h-8 text-sm font-mono"
            />
            <select
              value={extractor.scope}
              onChange={(e) => updateExtractor(idx, 'scope', e.target.value)}
              className="h-8 px-2 text-sm bg-background border border-border/50 rounded-md"
            >
              <option value="environment">Environment</option>
              <option value="local">Local</option>
              <option value="global">Global</option>
            </select>

            {/* Preview result */}
            {previewResult && previewResult[idx] && (
              <Badge
                variant={previewResult[idx].found ? "default" : "secondary"}
                className={previewResult[idx].found ? "bg-emerald-500/20 text-emerald-600" : "bg-destructive/20 text-destructive"}
              >
                {previewResult[idx].found
                  ? `${previewResult[idx].value?.substring(0, 20)}${previewResult[idx].value?.length > 20 ? '...' : ''}`
                  : 'Not found'
                }
              </Badge>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => removeExtractor(idx)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={addExtractor}
          className="w-full gap-2"
        >
          <Plus className="h-3 w-3" />
          Add Extraction
        </Button>
      </div>

      {/* Templates */}
      <div className="px-4 py-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full text-xs text-muted-foreground"
        >
          {showTemplates ? 'Hide' : 'Show'} common templates
        </Button>

        {showTemplates && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {VARIABLE_TEMPLATES.map((template, idx) => (
              <button
                key={idx}
                onClick={() => useTemplate(template)}
                className="text-left p-2 text-xs rounded border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-muted-foreground font-mono text-[10px]">{template.path}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generated Script */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View generated Postman-compatible script
          </summary>
          <pre className="mt-2 p-2 bg-background rounded border border-border/30 overflow-x-auto">
            <code>{generateTestScript() || '// Add extractors to generate script'}</code>
          </pre>
        </details>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hasResponse ? 'Response ready for extraction' : 'Send a request first'}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExtractors([{ name: '', path: '', scope: 'environment' }])}
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={applyExtractions}
            disabled={!hasResponse || !extractors.some(e => e.name && e.path)}
            className="gap-2"
          >
            <Play className="h-3 w-3" />
            Extract Variables
          </Button>
        </div>
      </div>
    </div>
  )
}
