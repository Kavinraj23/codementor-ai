'use client';

import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SessionData {
  sessionId: string;
  problemPrompt: string;
}

interface Problem {
  title: string;
  description: string;
}

interface ScoringResult {
  scores: {
    correctness: number;
    efficiency: number;
    style: number;
    communication: number;
    overall: number;
  };
  feedback: string;
}

export default function InterviewPage() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [code, setCode] = useState('# Write your solution here\n\n');
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ScoringResult | null>(null);

  // Sample problems - in a real app, these would come from a database
  const sampleProblems = [
    {
      title: "Two Sum",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      title: "Reverse Linked List",
      description: "Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nExample:\nInput: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]"
    },
    {
      title: "Valid Parentheses",
      description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n\nExample:\nInput: s = \"()\"\nOutput: true"
    }
  ];

  const startInterview = async (problem: Problem) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: 'user@example.com', // In real app, get from auth
          problemPrompt: `${problem.title}\n\n${problem.description}`
        })
      });

      const data = await response.json();
      if (data.success) {
        setSessionData({
          sessionId: data.sessionId,
          problemPrompt: `${problem.title}\n\n${problem.description}`
        });
        
        // Add initial AI message
        setChatHistory([{
          role: 'assistant',
          content: `Hi! I'm your AI interviewer. Today we'll be working on "${problem.title}". Take your time to read through the problem and let me know when you're ready to start, or if you have any questions about the requirements.`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionData) return;

    const userMessage = { role: 'user' as const, content: currentMessage, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          message: currentMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setIsLoading(false);
  };

  const submitCode = async () => {
    if (!sessionData) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          finalCode: code
        })
      });

      const data = await response.json();
      if (data.success) {
        setResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Failed to submit code:', error);
    }
    setIsLoading(false);
  };

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Interview Results</h1>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Scores</h2>
                <div className="space-y-4">
                  {Object.entries(results.scores).map(([category, score]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{category}:</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">{score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Overall Score</h2>
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 mb-2">
                    {results.scores.overall}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">out of 100</div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Detailed Feedback</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{results.feedback}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Start New Interview
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Problem</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Select a coding problem to begin your interview</p>
          </div>

          <div className="grid gap-6">
            {sampleProblems.map((problem, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{problem.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">{problem.description}</p>
                <button
                  onClick={() => startInterview(problem)}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg"
                >
                  {isLoading ? 'Starting...' : 'Start Interview'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Chat Panel */}
        <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Interviewer</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                  <div className="animate-pulse text-gray-600 dark:text-gray-400">AI is typing...</div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask questions or describe your approach..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !currentMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="bg-white dark:bg-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Code Editor</h2>
            <button
              onClick={submitCode}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
            >
              {isLoading ? 'Submitting...' : 'Submit Solution'}
            </button>
          </div>
          
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 