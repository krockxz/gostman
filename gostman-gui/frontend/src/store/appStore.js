import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { parseRequest } from '../lib/dataUtils'

const DEFAULT_REQUEST = {
  id: '', name: 'New Request', method: 'GET', url: '',
  headers: '{}', body: '', queryParams: '{}', response: ''
}

export const useAppStore = create(
  devtools(
    persist(
      (set) => ({
        // State
        requests: [],
        folders: [],
        variables: '{}',
        requestHistory: [],
        tabs: [{ id: 'tab-1', request: { ...DEFAULT_REQUEST }, status: '', loading: false, responseTime: null }],
        activeTabId: 'tab-1',
        nextTabId: 2,
        activeRequest: { ...DEFAULT_REQUEST },
        activeRequestTab: 'body', // Active tab in RequestTabs ('body', 'graphql', 'websocket', etc.)
        showLanding: true,
        webStatus: '',
        webLoading: false,
        webResponseTime: null,
        codeDialogOpen: false,
        codeSnippets: null,
        importDialogOpen: false,
        commandPaletteOpen: false,

        // Dialog states (not persisted)
        alertDialog: { isOpen: false, title: '', message: '', confirmText: 'OK', variant: 'default', onConfirm: null },
        confirmDialog: { isOpen: false, title: '', message: '', confirmText: 'Confirm', variant: 'default', onConfirm: null, onCancel: null },
        promptDialog: { isOpen: false, title: '', message: '', placeholder: '', defaultValue: '', confirmText: 'OK', onConfirm: null, onCancel: null },

        // Requests
        setRequests: (requests) => set({ requests }),
        addRequest: (request) => set((state) => ({ requests: [...state.requests, request] })),
        updateRequest: (id, updates) => set((state) => ({
          requests: state.requests.map(r => r.id === id ? { ...r, ...updates } : r)
        })),
        deleteRequest: (id) => set((state) => ({ requests: state.requests.filter(r => r.id !== id) })),

        // Folders
        setFolders: (folders) => set({ folders }),
        addFolder: (name) => {
          const id = `folder-${Date.now()}`
          set((state) => ({ folders: [...state.folders, { id, name, isOpen: true }] }))
          return id
        },
        deleteFolder: (folderId) => set((state) => ({ folders: state.folders.filter(f => f.id !== folderId) })),
        toggleFolder: (folderId) => set((state) => ({
          folders: state.folders.map(f => f.id === folderId ? { ...f, isOpen: !f.isOpen } : f)
        })),

        // History
        addToHistory: (request) => set((state) => {
          const item = { ...request, id: `hist-${Date.now()}`, timestamp: new Date().toISOString() }
          const filtered = state.requestHistory.filter(h => !(h.method === request.method && h.url === request.url))
          return { requestHistory: [item, ...filtered].slice(0, 50) }
        }),
        deleteHistoryItem: (id) => set((state) => ({ requestHistory: state.requestHistory.filter(h => h.id !== id) })),
        clearHistory: () => set({ requestHistory: [] }),
        setRequestHistory: (history) => set({ requestHistory: history }),

        // Tabs
        setActiveTab: (tabId) => set({ activeTabId: tabId }),
        newTab: (folderId = null) => set((state) => {
          const id = `tab-${state.nextTabId}`
          return { tabs: [...state.tabs, { id, request: { ...DEFAULT_REQUEST, folderId }, status: '', loading: false, responseTime: null }], activeTabId: id, nextTabId: state.nextTabId + 1 }
        }),
        closeTab: (tabId) => set((state) => {
          if (state.tabs.length === 1) return state
          const newTabs = state.tabs.filter(t => t.id !== tabId)
          let newActiveTabId = state.activeTabId
          if (state.activeTabId === tabId) {
            const idx = state.tabs.findIndex(t => t.id === tabId)
            newActiveTabId = newTabs[Math.max(0, idx - 1)]?.id || newTabs[0]?.id
          }
          return { tabs: newTabs, activeTabId: newActiveTabId }
        }),
        updateActiveTab: (updates) => set((state) => ({
          tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, ...updates } : t)
        })),
        updateActiveRequest: (updates) => set((state) => ({
          tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, request: { ...t.request, ...updates } } : t)
        })),
        loadRequestIntoTab: (request) => set((state) => ({
          tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, request: parseRequest(request), status: '', responseTime: null } : t)
        })),
        loadHistoryIntoTab: (item) => set((state) => ({
          tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, request: { ...parseRequest(item), response: '' }, status: '', responseTime: null } : t)
        })),

        // Variables
        setVariables: (variables) => set({ variables }),

        // UI State
        openCodeDialog: (snippets) => set({ codeDialogOpen: true, codeSnippets: snippets }),
        closeCodeDialog: () => set({ codeDialogOpen: false, codeSnippets: null }),
        openImportDialog: () => set({ importDialogOpen: true }),
        closeImportDialog: () => set({ importDialogOpen: false }),

        // Dialog actions (non-blocking alternatives to alert/confirm/prompt)
        showAlert: (title, message, confirmText = 'OK', variant = 'default') => set({
          alertDialog: { isOpen: true, title, message, confirmText, variant }
        }),
        closeAlert: () => set({ alertDialog: { isOpen: false, title: '', message: '', confirmText: 'OK', variant: 'default' } }),

        showConfirm: (title, message, onConfirm, onCancel = null, variant = 'default') => set({
          confirmDialog: {
            isOpen: true,
            title,
            message,
            confirmText: variant === 'destructive' ? 'Delete' : 'Confirm',
            variant,
            onConfirm,
            onCancel
          }
        }),
        closeConfirm: () => set({ confirmDialog: { isOpen: false } }),

        showPrompt: (title, message, defaultValue = '', placeholder = '', onConfirm, onCancel = null) => set({
          promptDialog: { isOpen: true, title, message, placeholder, defaultValue, onConfirm, onCancel }
        }),
        closePrompt: () => set({ promptDialog: { isOpen: false } }),

        // Command palette
        openCommandPalette: () => set({ commandPaletteOpen: true }),
        closeCommandPalette: () => set({ commandPaletteOpen: false }),

        // Web version
        setActiveRequest: (requestOrUpdater) => set((state) => ({
          activeRequest: typeof requestOrUpdater === 'function'
            ? requestOrUpdater(state.activeRequest)
            : requestOrUpdater
        })),
        setActiveRequestTab: (tab) => set({ activeRequestTab: tab }),
        setShowLanding: (show) => set({ showLanding: show }),
        setWebStatus: (status) => set({ webStatus: status }),
        setWebLoading: (loading) => set({ webLoading: loading }),
        setWebResponseTime: (time) => set({ webResponseTime: time }),
      }),
      {
        name: 'gostman-storage',
        partialize: (state) => ({
          requests: state.requests,
          folders: state.folders,
          variables: state.variables,
          requestHistory: state.requestHistory,
        }),
      }
    ),
    { name: 'gostman-store', enabled: import.meta.env.DEV }
  )
)

export const useActiveTab = () => useAppStore((s) => s.tabs.find(t => t.id === s.activeTabId) || s.tabs[0])
export const useActiveRequest = () => useAppStore((s) => useActiveTab()?.request || { ...DEFAULT_REQUEST })
