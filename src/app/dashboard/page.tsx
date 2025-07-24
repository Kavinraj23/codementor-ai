'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SessionSummary {
  _id: string;
  problemPrompt: string;
  scores: {
    correctness: number;
    efficiency: number;
    style: number;
    communication: number;
    overall: number;
  };
  createdAt: string;
  feedback: string;
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch user's sessions from API
    // For now, we'll show some mock data to demonstrate the UI
    setTimeout(() => {
      setSessions([
        {
          _id: '1',
          problemPrompt: 'Two Sum\n\nGiven an array of integers nums and an integer target...',
          scores: {
            correctness: 85,
            efficiency: 75,
            style: 90,
            communication: 80,
            overall: 82
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          feedback: 'Great job solving the problem! Your solution is correct and well-structured...'
        },
        {
          _id: '2',
          problemPrompt: 'Reverse Linked List\n\nGiven the head of a singly linked list...',
          scores: {
            correctness: 95,
            efficiency: 85,
            style: 80,
            communication: 90,
            overall: 88
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          feedback: 'Excellent solution! You demonstrated strong understanding of linked lists...'
        },
        {
          _id: '3',
          problemPrompt: 'Valid Parentheses\n\nGiven a string s containing just the characters...',
          scores: {
            correctness: 70,
            efficiency: 80,
            style: 75,
            communication: 65,
            overall: 72
          },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          feedback: 'Good attempt! Consider edge cases and improve variable naming...'
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/20';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const averageScore = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, session) => sum + session.scores.overall, 0) / sessions.length)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your interview history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <Link
              href="/interview"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              New Interview
            </Link>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track your coding interview progress and performance
          </p>
        </div>

        {/* Stats Overview */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Interviews</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Average Score</h3>
              <p className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
                {averageScore}/100
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Best Score</h3>
              <p className={`text-3xl font-bold ${getScoreColor(Math.max(...sessions.map(s => s.scores.overall)))}`}>
                {Math.max(...sessions.map(s => s.scores.overall))}/100
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recent Activity</h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(sessions[0]?.createdAt || '')}
              </p>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Interview History</h2>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 002 2v1a1 1 0 102 0v-1a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No interviews yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start your first coding interview to see your progress here.
              </p>
              <Link
                href="/interview"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Start First Interview
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessions.map((session) => (
                <div key={session._id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {session.problemPrompt.split('\n')[0]}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(session.scores.overall)} ${getScoreColor(session.scores.overall)}`}>
                      {session.scores.overall}/100 Overall
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {Object.entries(session.scores).filter(([key]) => key !== 'overall').map(([category, score]) => (
                      <div key={category} className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          {category}
                        </p>
                        <p className={`text-lg font-semibold ${getScoreColor(score as number)}`}>
                          {score}/100
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {session.feedback}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 