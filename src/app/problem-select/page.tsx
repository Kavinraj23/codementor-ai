'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  LEETCODE_PROBLEMS, 
  getRandomProblem, 
  getProblemById, 
  getProblemByTitle,
  getProblemsByDifficulty,
  Problem 
} from '@/data/problems';

export default function ProblemSelect() {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'id' | 'title'>('title');
  const [showAllProblems, setShowAllProblems] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [searchError, setSearchError] = useState('');

  const handleRandomProblem = () => {
    const randomProblem = getRandomProblem();
    setSelectedProblem(randomProblem);
    setShowAllProblems(false);
  };

  const handleSearch = () => {
    setSearchError(''); // Clear previous error
    
    if (!searchTerm.trim()) {
      setSearchError('Please enter a search term');
      return;
    }

    let problem: Problem | undefined;
    
    if (searchType === 'id') {
      const id = parseInt(searchTerm);
      if (isNaN(id)) {
        setSearchError('Please enter a valid problem ID (number)');
        return;
      }
      problem = getProblemById(id);
    } else {
      problem = getProblemByTitle(searchTerm);
    }

    if (problem) {
      setSelectedProblem(problem);
      setShowAllProblems(false);
      setSearchError(''); // Clear error on success
    } else {
      setSearchError(`No problem found ${searchType === 'id' ? 'with ID' : 'with title containing'} "${searchTerm}"`);
    }
  };

  const handleProblemSelect = (problem: Problem) => {
    setSelectedProblem(problem);
    setShowAllProblems(false);
  };

  const getFilteredProblems = () => {
    if (difficultyFilter === 'All') {
      return LEETCODE_PROBLEMS;
    }
    return getProblemsByDifficulty(difficultyFilter);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const ProblemDisplay = ({ problem }: { problem: Problem }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {problem.id}. {problem.title}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>
        <Link
          href={`/interview/${problem.id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-flex items-center"
        >
          Start Interview
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
          </svg>
        </Link>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {problem.category.map((cat, index) => (
          <span 
            key={index}
            className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Companies */}
      {problem.companies && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Companies</h3>
          <div className="flex flex-wrap gap-2">
            {problem.companies.map((company, index) => (
              <span 
                key={index}
                className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-3 py-1 rounded-full text-sm font-medium"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Problem Description</h3>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
            {problem.description}
          </p>
        </div>
      </div>

      {/* Examples */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Examples</h3>
        <div className="space-y-4">
          {problem.examples.map((example, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example {index + 1}:</h4>
              <div className="space-y-1 text-sm">
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Constraints</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
          {problem.constraints.map((constraint, index) => (
            <li key={index} className="text-sm">{constraint}</li>
          ))}
        </ul>
      </div>

      {/* Complexity */}
      {(problem.timeComplexity || problem.spaceComplexity) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Expected Complexity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Hints */}
      {problem.hints && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hints</h3>
          <div className="space-y-2">
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

      {/* Follow Up */}
      {problem.followUp && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Follow Up</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {problem.followUp.map((followUp, index) => (
              <li key={index} className="text-sm">{followUp}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const ProblemList = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Problems</h2>
          <div className="flex gap-2">
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setDifficultyFilter(difficulty)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  difficultyFilter === difficulty
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {getFilteredProblems().map((problem) => (
          <div
            key={problem.id}
            onClick={() => handleProblemSelect(problem)}
            className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">{problem.id}</span>
                <span className="font-medium text-gray-900 dark:text-white">{problem.title}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              </div>
              <div className="flex gap-1">
                {problem.category.slice(0, 2).map((cat, index) => (
                  <span 
                    key={index}
                    className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded text-xs"
                  >
                    {cat}
                  </span>
                ))}
                {problem.category.length > 2 && (
                  <span className="text-gray-400 text-xs">+{problem.category.length - 2}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
    <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Problem Selection
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Choose a coding problem to practice with AI-powered interviews
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {!selectedProblem && !showAllProblems && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Choose Your Problem</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Random Problem */}
                <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <div className="text-blue-600 dark:text-blue-400 text-5xl mb-4">🎲</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Random Problem</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Get a surprise problem to challenge yourself</p>
                  <button
                    onClick={handleRandomProblem}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
                  >
                    Generate Random Problem
                  </button>
                </div>

                {/* Browse All */}
                <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors">
                  <div className="text-green-600 dark:text-green-400 text-5xl mb-4">📚</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Browse All Problems</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">View and select from all available problems</p>
                  <button
                    onClick={() => setShowAllProblems(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
                  >
                    Browse Problems
                  </button>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Search for a Specific Problem</h3>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSearchType('title')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      searchType === 'title'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    By Title
                  </button>
                  <button
                    onClick={() => setSearchType('id')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      searchType === 'id'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    By ID
                  </button>
                </div>
                
                <div className="flex-1">
                  <div className="flex gap-2">
                    <input
                      type={searchType === 'id' ? 'number' : 'text'}
                      placeholder={searchType === 'id' ? 'Enter problem ID (e.g., 1)' : 'Enter problem title (e.g., Two Sum)'}
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (searchError) setSearchError(''); // Clear error as user types
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                        searchError 
                          ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      onClick={handleSearch}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      Search
                    </button>
                  </div>
                  
                  {searchError && (
                    <div className="mt-2 text-red-600 dark:text-red-400 text-sm flex items-center animate-in slide-in-from-top-1 duration-200">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {searchError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Problems</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{LEETCODE_PROBLEMS.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getProblemsByDifficulty('Easy').length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Easy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{getProblemsByDifficulty('Medium').length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Medium</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{getProblemsByDifficulty('Hard').length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Hard</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show all problems list */}
        {showAllProblems && !selectedProblem && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-4">
              <button
                onClick={() => setShowAllProblems(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
              >
                ← Back to Selection
              </button>
            </div>
            <ProblemList />
          </div>
        )}

        {/* Show selected problem */}
        {selectedProblem && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => {
                  setSelectedProblem(null);
                  setShowAllProblems(false);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
              >
                ← Back to Selection
              </button>
              <button
                onClick={handleRandomProblem}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
              >
                🎲 Try Another Random
              </button>
            </div>
            <ProblemDisplay problem={selectedProblem} />
          </div>
        )}
      </div>
    </div>
  );
}