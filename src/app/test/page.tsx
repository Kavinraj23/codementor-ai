'use client';

import { useState } from 'react';
import { LeetCodeAPI } from '@/lib/leetcode-api';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testType, setTestType] = useState<string>('');

  const testDirectAPI = async (problemSlug: string) => {
    setLoading(true);
    setError(null);
    setTestType(`Direct API: ${problemSlug}`);
    
    try {
      console.log(`🧪 Testing direct API route: /api/leetcode/problem/${problemSlug}`);
      const response = await fetch(`/api/leetcode/problem/${problemSlug}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      console.log('✅ Direct API Test Success:', data.title);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('❌ Direct API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testAPIClass = async (problemSlug: string) => {
    setLoading(true);
    setError(null);
    setTestType(`API Class: ${problemSlug}`);
    
    try {
      console.log(`🧪 Testing LeetCodeAPI class: getProblem('${problemSlug}')`);
      const api = new LeetCodeAPI();
      const problem = await api.getProblem(problemSlug);
      setResult(problem);
      console.log('✅ LeetCodeAPI Class Test Success:', problem.title);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('❌ LeetCodeAPI Class Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
    setTestType('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🧪 LeetCode API Test Suite</h1>
          <p className="text-gray-600">Test your LeetCode API integration and data transformation</p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🎯 Run Tests</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Direct API Route Tests</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => testDirectAPI('two-sum')}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  Test "two-sum"
                </button>
                <button 
                  onClick={() => testDirectAPI('1')}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  Test by ID "1"
                </button>
                <button 
                  onClick={() => testDirectAPI('reverse-linked-list')}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  Test "reverse-linked-list"
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-3">LeetCodeAPI Class Tests</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => testAPIClass('two-sum')}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  Class: "two-sum"
                </button>
                <button 
                  onClick={() => testAPIClass('valid-parentheses')}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  Class: "valid-parentheses"
                </button>
                <button 
                  onClick={() => testAPIClass('best-time-to-buy-and-sell-stock')}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  Class: "buy-sell-stock"
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={clearResults}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Clear Results
            </button>
            <div className="flex-1"></div>
            {loading && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Testing {testType}...
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="text-red-600 mr-2">❌</div>
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Test Failed</h3>
                <p className="text-red-700">{error}</p>
                <div className="mt-4 text-sm text-red-600">
                  <strong>Common issues:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>Check if your dev server is running</li>
                    <li>Verify the API route file exists at <code>src/app/api/leetcode/problem/[slug]/route.ts</code></li>
                    <li>Check browser network tab for failed requests</li>
                    <li>Look at server console for error logs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">✅ Test Results</h2>
              <span className="text-sm text-gray-500">Testing: {testType}</span>
            </div>
            
            {/* Key Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-600">Title:</span>
                <p className="font-medium">{result.title || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Difficulty:</span>
                <p className="font-medium">
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    result.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    result.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.difficulty || 'N/A'}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Question ID:</span>
                <p className="font-medium">{result.questionFrontendId || result.questionId || 'N/A'}</p>
              </div>
            </div>

            {/* Data Structure Analysis */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">📊 Data Structure Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-blue-600 font-medium">Content</div>
                  <div>{result.content ? '✅ Present' : '❌ Missing'}</div>
                </div>
                <div className="p-3 bg-green-50 rounded">
                  <div className="text-green-600 font-medium">Hints</div>
                  <div>{result.hints?.length || 0} available</div>
                </div>
                <div className="p-3 bg-purple-50 rounded">
                  <div className="text-purple-600 font-medium">Topic Tags</div>
                  <div>{result.topicTags?.length || 0} tags</div>
                </div>
                <div className="p-3 bg-orange-50 rounded">
                  <div className="text-orange-600 font-medium">Premium</div>
                  <div>{result.isPaidOnly ? '💎 Yes' : '🆓 No'}</div>
                </div>
              </div>
            </div>

            {/* Topic Tags */}
            {result.topicTags && result.topicTags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">🏷️ Topic Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {result.topicTags.map((tag: any, index: number) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Hints */}
            {result.hints && result.hints.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">💡 Hints</h3>
                <div className="space-y-2">
                  {result.hints.slice(0, 3).map((hint: string, index: number) => (
                    <div key={index} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
                      <strong>Hint {index + 1}:</strong> {hint.substring(0, 150)}...
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Data */}
            <details className="mt-6">
              <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                🔍 View Raw JSON Response ({Object.keys(result).length} fields)
              </summary>
              <div className="mt-4 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Next Steps</h3>
          <div className="text-blue-700 text-sm space-y-1">
            <p>1. <strong>Test the API route first</strong> - make sure data is flowing</p>
            <p>2. <strong>Check the raw JSON structure</strong> - see what fields are available</p>
            <p>3. <strong>Note differences</strong> - your interface vs. actual API response</p>
            <p>4. <strong>Add data transformation</strong> - convert API response to your LeetCodeProblem interface</p>
          </div>
        </div>
      </div>
    </div>
  );
} 