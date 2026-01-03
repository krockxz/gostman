import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Plus, Trash2, Code2, FolderOpen, Info, Link2, Sparkles, ChevronDown, CheckCircle2, Target } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import {
  extractFromResponse,
  extractFromHeaders,
  VARIABLE_TEMPLATES,
  createTestScript
} from "../lib/chaining"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

const scopeConfig = {
  environment: { label: 'Environment', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  local: { label: 'Local', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  global: { label: 'Global', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
}

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
  const [extractedCount, setExtractedCount] = useState(0)
  const [showScript, setShowScript] = useState(false)

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

    // Show extracted count
    const count = Object.keys(extracted).length
    setExtractedCount(count)
    setTimeout(() => setExtractedCount(0), 3000)
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
    <motion.div
      className="flex flex-col h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with gradient */}
      <motion.div
        className="relative overflow-hidden"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10" />
        <div className="relative px-4 py-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Link2 className="h-5 w-5 text-purple-500" />
              </motion.div>
              <div>
                <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Request Chaining
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {extractedCount > 0 ? (
                    <motion.div
                      key={extractedCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-[10px] text-emerald-400"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {extractedCount} variable{extractedCount > 1 ? 's' : ''} extracted
                    </motion.div>
                  ) : hasResponse ? (
                    <span className="text-[10px] text-emerald-400">Response ready</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Send a request first</span>
                  )}
                </div>
              </div>
            </div>
            <AnimatePresence>
              {hasResponse && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                    <Target className="h-3 w-3" />
                    Ready
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Instructions with enhanced styling */}
      <motion.div
        className="px-4 py-3 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-b border-purple-500/10"
        variants={itemVariants}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Info className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Extract values from responses to use in subsequent requests.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Use <span className="text-purple-400 font-mono">dot.notation</span> for nested values.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Extractors List with enhanced animations */}
      <motion.div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        variants={itemVariants}
      >
        <AnimatePresence mode="popLayout">
          {extractors.map((extractor, idx) => (
            <motion.div
              key={idx}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="relative group"
            >
              {/* Scope indicator border */}
              <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${scopeConfig[extractor.scope]?.bg || scopeConfig.environment.bg}`} />

              <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/10 ml-3 hover:border-border/80 transition-colors">
                <Input
                  placeholder="variable_name"
                  value={extractor.name}
                  onChange={(e) => updateExtractor(idx, 'name', e.target.value)}
                  className="flex-1 h-9 text-sm bg-background/50"
                />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-muted-foreground text-xs">$</span>
                  <Input
                    placeholder="data.user.id"
                    value={extractor.path}
                    onChange={(e) => updateExtractor(idx, 'path', e.target.value)}
                    className="flex-1 h-9 text-sm font-mono bg-background/50"
                  />
                </div>

                {/* Animated scope selector */}
                <motion.select
                  value={extractor.scope}
                  onChange={(e) => updateExtractor(idx, 'scope', e.target.value)}
                  className={`h-9 px-3 text-sm rounded-md border cursor-pointer transition-colors ${
                    scopeConfig[extractor.scope]?.bg || scopeConfig.environment.bg
                  } ${scopeConfig[extractor.scope]?.border || scopeConfig.environment.border} ${
                    scopeConfig[extractor.scope]?.color || scopeConfig.environment.color
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <option value="environment">Environment</option>
                  <option value="local">Local</option>
                  <option value="global">Global</option>
                </motion.select>

                {/* Live preview with animation */}
                <AnimatePresence>
                  {previewResult && previewResult[idx] && extractor.name && extractor.path && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Badge
                        variant={previewResult[idx].found ? "default" : "secondary"}
                        className={`gap-1 ${
                          previewResult[idx].found
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-destructive/20 text-destructive border-destructive/30"
                        }`}
                      >
                        {previewResult[idx].found ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            {previewResult[idx].value?.substring(0, 15)}
                            {previewResult[idx].value?.length > 15 ? '...' : ''}
                          </>
                        ) : (
                          <>—</>
                        )}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeExtractor(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add button with animation */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={addExtractor}
            className="w-full gap-2 border-dashed"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Extraction Rule
          </Button>
        </motion.div>
      </motion.div>

      {/* Templates section */}
      <motion.div
        className="px-4 py-2 border-t border-border/50"
        variants={itemVariants}
      >
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2"
        >
          <motion.div
            animate={{ rotate: showTemplates ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
          {showTemplates ? 'Hide' : 'Show'} common templates
        </motion.button>

        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 grid grid-cols-2 gap-2">
                {VARIABLE_TEMPLATES.map((template, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => useTemplate(template)}
                    className="text-left p-3 text-xs rounded-lg border border-border/30 hover:border-purple-500/30 hover:bg-purple-500/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      {template.name}
                    </div>
                    <div className="text-muted-foreground font-mono text-[10px] mt-1 bg-background/50 rounded px-1.5 py-0.5">
                      {template.path}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Generated Script Preview */}
      <motion.div
        className="px-4 py-2 border-t border-border/50 bg-muted/20"
        variants={itemVariants}
      >
        <details
          open={showScript}
          onToggle={(e) => setShowScript(e.target.open)}
          className="text-xs"
        >
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2 select-none">
            <Code2 className="h-3.5 w-3.5" />
            Generated Postman-compatible script
          </summary>
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <pre className="p-3 bg-background rounded-lg border border-border/30 overflow-x-auto text-xs">
              <code className="text-muted-foreground">{generateTestScript() || '// Add extraction rules to generate script'}</code>
            </pre>
          </motion.div>
        </details>
      </motion.div>

      {/* Footer Actions */}
      <motion.div
        className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between"
        variants={itemVariants}
      >
        <p className="text-xs text-muted-foreground">
          {hasResponse ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Response available
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              Send a request first
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExtractors([{ name: '', path: '', scope: 'environment' }])}
            >
              Clear All
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="sm"
              onClick={applyExtractions}
              disabled={!hasResponse || !extractors.some(e => e.name && e.path)}
              className="gap-2"
            >
              <Play className="h-3.5 w-3.5" />
              Extract Variables
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
