'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

interface PythonEditorProps {
  initialCode: string;
  onChange: (code: string) => void;
  onReady?: (isReady: boolean) => void;
  height?: string;
}

export default function PythonEditor({ 
  initialCode, 
  onChange, 
  onReady,
  height = "400px" 
}: PythonEditorProps) {
  const [isDark, setIsDark] = useState(true);

  const handleEditorDidMount = () => {
    onReady?.(true);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">Python 3.x</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Monaco Editor</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors"
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>
      
      <Editor
        height={height}
        defaultLanguage="python"
        value={initialCode}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        theme={isDark ? "vs-dark" : "vs"}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: 'on',
          bracketPairColorization: { enabled: true },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showClasses: true,
            showFunctions: true,
            showVariables: true,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
          parameterHints: { enabled: true },
          hover: { enabled: true },
          contextmenu: true,
          selectOnLineNumbers: true,
          cursorStyle: 'line',
          cursorWidth: 2,
          renderWhitespace: 'selection',
          showFoldingControls: 'always',
          smoothScrolling: true,
          cursorBlinking: 'blink',
          multiCursorModifier: 'ctrlCmd',
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: 'full',
          detectIndentation: false,
          rulers: [80, 120], // PEP 8 guidelines
        }}
        loading={
          <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-700">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading Python Editor...</p>
            </div>
          </div>
        }
      />
    </div>
  );
}