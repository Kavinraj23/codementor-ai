'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { getProblemById, Problem } from '@/data/problems';
import { getFullPythonCode } from '@/data/pythonTemplates';

interface InterviewPageProps {
  params: Promise<{
    problemId: string;
  }>;
}

export default function InterviewPage({ params }: InterviewPageProps) {
  const resolvedParams = use(params) as { problemId: string };
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'chat' | 'testcases'>('problem');

  useEffect(() => {
    const problemId = parseInt(resolvedParams.problemId);
    
    if (isNaN(problemId)) {
      setError('Invalid problem ID');
      setLoading(false);
      return;
    }

    const foundProblem = getProblemById(problemId);
    
    if (foundProblem) {
      setProblem(foundProblem);
      // Load Python starter code for this problem
      const starterCode = getFullPythonCode(problemId);
      setCode(starterCode);
    } else {
      setError(`Problem with ID ${problemId} not found`);
    }
    
    setLoading(false);
  }, [resolvedParams.problemId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Problem Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Link
            href="/problem-select"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            ← Back to Problem Selection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                AI Interview Session
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Solve the problem with AI-powered guidance and feedback
              </p>
            </div>
            <div className="mt-3 md:mt-0 flex gap-3">
              <Link
                href="/problem-select"
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
              >
                ← Change Problem
              </Link>
              <Link
                href="/dashboard"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden px-4 py-4">
        <div className="container mx-auto h-full">
          <div className="grid lg:grid-cols-2 gap-4 h-full">
            {/* Left Panel - Tabbed Interface */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('problem')}
                  className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                    activeTab === 'problem'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  📝 Problem
                </button>
                <button
                  onClick={() => setActiveTab('testcases')}
                  className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                    activeTab === 'testcases'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  🧪 Test Cases
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  🤖 AI Chat
                  <div className="w-2 h-2 bg-green-500 rounded-full inline-block ml-2"></div>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {/* Problem Tab */}
                {activeTab === 'problem' && (
                  <div className="h-full flex flex-col">
                    {/* Problem Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {problem.id}. {problem.title}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      </div>
                      
                      {/* Categories */}
                      <div className="flex flex-wrap gap-2">
                        {problem.category.map((cat, index) => (
                          <span 
                            key={index}
                            className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Scrollable Problem Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Description */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Problem Description</h3>
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                            {problem.description}
                          </p>
                        </div>
                      </div>

                      {/* Examples */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Examples</h3>
                        <div className="space-y-4">
                          {problem.examples.map((example, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example {index + 1}:</h4>
                              <div className="space-y-2 text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Input:</span> {example.input}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Output:</span> {example.output}
                                </p>
                                {example.explanation && (
                                  <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Explanation:</span> {example.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Constraints */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Constraints</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                          {problem.constraints.map((constraint, index) => (
                            <li key={index} className="text-sm">{constraint}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Complexity (if available) */}
                      {(problem.timeComplexity || problem.spaceComplexity) && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Expected Complexity</h3>
                          <div className="grid grid-cols-1 gap-3">
                            {problem.timeComplexity && (
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                <span className="font-medium text-green-800 dark:text-green-400">Time Complexity:</span>
                                <span className="ml-2 text-green-700 dark:text-green-300">{problem.timeComplexity}</span>
                              </div>
                            )}
                            {problem.spaceComplexity && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                <span className="font-medium text-blue-800 dark:text-blue-400">Space Complexity:</span>
                                <span className="ml-2 text-blue-700 dark:text-blue-300">{problem.spaceComplexity}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Hints (if available) */}
                      {problem.hints && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hints</h3>
                          <div className="space-y-3">
                            {problem.hints.map((hint, index) => (
                              <details key={index} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                                <summary className="font-medium text-yellow-800 dark:text-yellow-400 cursor-pointer">
                                  Hint {index + 1}
                                </summary>
                                <p className="mt-2 text-yellow-700 dark:text-yellow-300 text-sm">{hint}</p>
                              </details>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Test Cases Tab */}
                {activeTab === 'testcases' && (
                  <div className="h-full flex flex-col">
                    {/* Test Cases Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Test Cases & Output</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {problem.examples.length} test case{problem.examples.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Test Cases Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Individual Test Cases */}
                      {problem.examples.map((example, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                          {/* Test Case Header */}
                          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Test Case {index + 1}
                              </h4>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">Not Run</span>
                              </div>
                            </div>
                          </div>

                          {/* Test Case Content */}
                          <div className="p-4 space-y-3">
                            {/* Input */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Input:
                              </label>
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 font-mono text-sm">
                                <code className="text-gray-900 dark:text-gray-100">{example.input}</code>
                              </div>
                            </div>

                            {/* Expected Output */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Expected Output:
                              </label>
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 font-mono text-sm">
                                <code className="text-gray-900 dark:text-gray-100">{example.output}</code>
                              </div>
                            </div>

                            {/* Actual Output (Placeholder) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Your Output:
                              </label>
                              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 font-mono text-sm min-h-[3rem] flex items-center">
                                <span className="text-gray-500 dark:text-gray-500 italic">
                                  Run code to see output...
                                </span>
                              </div>
                            </div>

                            {/* Explanation (if available) */}
                            {example.explanation && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Explanation:
                                </label>
                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
                                  {example.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Overall Results Summary */}
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🧪</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              Ready to Test Your Code
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Click &quot;Run Test Cases&quot; in the code editor to see results here
                            </p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Passed: 0</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>Failed: 0</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span>Total: {problem.examples.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Runtime Information */}
                      {/* <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Runtime Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Execution Time:</span>
                            <div className="font-mono text-gray-900 dark:text-gray-100">-</div>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Memory Usage:</span>
                            <div className="font-mono text-gray-900 dark:text-gray-100">-</div>
                          </div>
                        </div>
                      </div> */}
                    </div>
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div className="h-full flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Interview Assistant</h3>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white">🤖</span>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-[85%]">
                          <p className="text-blue-900 dark:text-blue-200">
                            Welcome to your coding interview! I&apos;m here to help guide you through solving <strong>{problem.title}</strong>.
                          </p>
                          <ul className="mt-3 text-blue-800 dark:text-blue-300 text-sm space-y-1">
                            <li>• Think out loud about your approach</li>
                            <li>• Ask questions about the problem</li>
                            <li>• Request hints if you get stuck</li>
                            <li>• Discuss time/space complexity</li>
                          </ul>
                          <p className="mt-3 text-blue-700 dark:text-blue-400 text-sm">
                            Start by explaining your initial thoughts about the problem!
                          </p>
                        </div>
                      </div>

                      {/* Example conversation */}
                      <div className="flex items-start gap-3 justify-end">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-[85%]">
                          <p className="text-gray-900 dark:text-gray-200">
                            I think I can use a sliding window approach for this problem...
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white">👤</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white">🤖</span>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-[85%]">
                          <p className="text-blue-900 dark:text-blue-200">
                            Excellent thinking! A sliding window approach is indeed perfect for this problem. Can you walk me through how you would implement it?
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="flex gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Type your thoughts, questions, or request a hint..."
                          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium">
                          Send
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors">
                          💡 Get Hint
                        </button>
                        <button className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors">
                          🔍 Clarify Problem
                        </button>
                        <button className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors">
                          📊 Discuss Complexity
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Code Editor */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Python Code Editor</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Python 3.x</span>
                    </div>
                    <button
                      onClick={() => setCode(getFullPythonCode(parseInt(resolvedParams.problemId)))}
                      className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors"
                    >
                      Reset Code
                    </button>
                  </div>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={() => setIsEditorReady(true)}
                  theme="vs-dark"
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
                    rulers: [80, 120],
                  }}
                  loading={
                    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-700">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Loading Python Editor...</p>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex flex-col gap-2">
                  <button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    disabled={!isEditorReady}
                    onClick={() => {
                      console.log('Running test cases with code:', code);
                    }}
                  >
                    🧪 Run Test Cases
                  </button>
                  <button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    disabled={!isEditorReady}
                    onClick={() => {
                      console.log('Getting AI hint for problem:', problem?.id);
                    }}
                  >
                    🤖 Get AI Hint
                  </button>
                  <button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    disabled={!isEditorReady}
                    onClick={() => {
                      console.log('Submitting solution:', code);
                    }}
                  >
                    ✅ Submit Solution
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}