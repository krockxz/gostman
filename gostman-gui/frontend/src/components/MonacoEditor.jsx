import Editor from '@monaco-editor/react'

export function MonacoEditor({ value, onChange, language = "json", height = "300px" }) {
    const handleEditorChange = (value) => {
        onChange?.({ target: { value: value || "" } })
    }

    return (
        <Editor
            height={height}
            defaultLanguage={language}
            value={value}
            onChange={handleEditorChange}
            theme="vs-dark"
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
