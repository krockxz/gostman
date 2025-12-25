import { JsonView } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from './ui/button'

export function JsonViewer({ data }) {
    const [copied, setCopied] = useState(false)
    const [viewMode, setViewMode] = useState('tree') // 'tree' or 'raw'

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const tryParseJSON = (data) => {
        if (typeof data === 'object') return data
        try {
            return JSON.parse(data)
        } catch {
            return null
        }
    }

    const jsonData = tryParseJSON(data)
    const isValidJSON = jsonData !== null

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={viewMode === 'tree' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('tree')}
                        disabled={!isValidJSON}
                    >
                        Tree
                    </Button>
                    <Button
                        size="sm"
                        variant={viewMode === 'raw' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('raw')}
                    >
                        Raw
                    </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {viewMode === 'tree' && isValidJSON ? (
                    <JsonView
                        data={jsonData}
                        shouldExpandNode={(level) => level < 2}
                    />
                ) : (
                    <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                        {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
                    </pre>
                )}
            </div>
        </div>
    )
}
