import Editor from '@monaco-editor/react'
import { useEffect, useRef } from 'react'

export function MonacoEditor({ value, onChange, language = "json", height = "300px" }) {
    const editorRef = useRef(null)

    const handleEditorChange = (value) => {
        onChange?.({ target: { value: value || "" } })
    }

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor

        // Define custom theme matching app's electric cyan color scheme
        monaco.editor.defineTheme('gostman-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'string', foreground: '5eead4' }, // Teal-200 for strings
                { token: 'number', foreground: 'fb923c' }, // Orange for numbers
                { token: 'keyword', foreground: '22d3ee' }, // Cyan-400 for keywords
                { token: 'comment', foreground: '6b7280', fontStyle: 'italic' }, // Gray for comments
                { token: 'type', foreground: 'a78bfa' }, // Purple for types
                { token: 'variable', foreground: 'f0f9ff' }, // Light blue for variables
            ],
            colors: {
                'editor.background': '#0c1222', // Match app background
                'editor.foreground': '#f0f9ff', // Light text
                'editorLineNumber.foreground': '#475569', // Subtle line numbers
                'editorLineNumber.activeForeground': '#22d3ee', // Cyan for active line
                'editor.selectionBackground': '#22d3ee40', // Cyan selection with transparency
                'editor.lineHighlightBackground': '#1e293b', // Subtle line highlight
                'editorCursor.foreground': '#22d3ee', // Cyan cursor
                'editorWhitespace.foreground': '#334155', // Subtle whitespace
                'editorIndentGuide.background': '#1e293b', // Indent guides
                'editorIndentGuide.activeBackground': '#334155', // Active indent guide
                'scrollbarSlider.background': '#334155', // Scrollbar
                'scrollbarSlider.hoverBackground': '#475569', // Scrollbar hover
                'scrollbarSlider.activeBackground': '#64748b', // Scrollbar active
            }
        })

        monaco.editor.setTheme('gostman-dark')
    }

    return (
        <Editor
            height={height}
            defaultLanguage={language}
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="gostman-dark"
            options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 2,
                wordWrap: "on",
                suggest: {
                    showKeywords: true,
                },
                quickSuggestions: {
                    other: true,
                    strings: true,
                },
            }}
        />
    )
}
