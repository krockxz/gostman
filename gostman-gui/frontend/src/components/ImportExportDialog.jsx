import React, { useState } from "react"
import {
  X, Upload, Download
} from "lucide-react"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ImportTab } from "./ImportTab"
import { ExportTab } from "./ExportTab"

export function ImportExportDialog({
  requests = [],
  folders = [],
  variables = {},
  onImport,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('import')

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
              <ImportTab onImport={onImport} onClose={onClose} />
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="mt-0 animate-in fade-in-50 duration-200">
              <ExportTab
                requests={requests}
                folders={folders}
                variables={variables}
              />
            </TabsContent>
          </Tabs>
        </div >

        {/* Footer */}
        < div className="px-6 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between" >
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded bg-background border border-border/50 font-mono text-[10px]">Esc</kbd> to close
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div >
      </div >
    </div >
  )
}
