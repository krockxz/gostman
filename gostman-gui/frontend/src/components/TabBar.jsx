import { X, Plus } from 'lucide-react'
import { cn } from '../lib/utils'

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose, onNewTab }) {
    const getMethodColor = (method) => {
        const colors = {
            GET: 'text-blue-400',
            POST: 'text-green-400',
            PUT: 'text-orange-400',
            DELETE: 'text-red-400',
            PATCH: 'text-purple-400',
            HEAD: 'text-cyan-400',
        }
        return colors[method] || 'text-gray-400'
    }

    return (
        <div className="flex items-center gap-1 border-b bg-muted/5 px-2 py-1 overflow-x-auto scrollbar-thin">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={cn(
                        'group flex items-center gap-2 rounded-t px-3 py-1.5 text-sm cursor-pointer transition-colors min-w-[120px] max-w-[180px]',
                        activeTabId === tab.id
                            ? 'bg-background border-t border-x text-foreground'
                            : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                    onClick={() => onTabSelect(tab.id)}
                >
                    <span className={cn('text-xs font-mono font-semibold', getMethodColor(tab.request.method))}>
                        {tab.request.method}
                    </span>
                    <span className="flex-1 truncate text-xs">
                        {tab.request.name || 'Untitled'}
                    </span>
                    <button
                        className={cn(
                            'p-0.5 rounded hover:bg-muted-foreground/20 transition-opacity',
                            activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                        onClick={(e) => {
                            e.stopPropagation()
                            onTabClose(tab.id)
                        }}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}

            <button
                className="flex items-center gap-1 rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                onClick={onNewTab}
            >
                <Plus className="h-3.5 w-3.5" />
                New
            </button>
        </div>
    )
}
