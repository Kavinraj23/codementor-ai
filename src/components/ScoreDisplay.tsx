import React from 'react';
import { ScoreBreakdown, InterviewScorer } from '@/lib/scoring';

interface ScoreDisplayProps {
  score: ScoreBreakdown;
  problemTitle: string;
  difficulty: string;
  timeTaken: number;
  testCasesPassed: number;
  totalTestCases: number;
}

export default function ScoreDisplay({
  score,
  problemTitle,
  difficulty,
  timeTaken,
  testCasesPassed,
  totalTestCases
}: ScoreDisplayProps) {
  const getScoreBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreBarWidth = (score: number, maxScore: number) => {
    return `${(score / maxScore) * 100}%`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Interview Results
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {problemTitle} • {difficulty} Difficulty
        </p>
      </div>

             {/* Overall Score */}
       <div className="text-center mb-8">
         <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-4">
           <div className="text-center">
             <div className="text-3xl font-bold">{score.grade}</div>
             <div className="text-sm opacity-90">{score.percentage}%</div>
           </div>
         </div>
         <div className={`text-2xl font-bold ${InterviewScorer.getScoreColor(score.percentage)}`}>
           {score.total}/100 Points
         </div>
       </div>

       {/* Final Performance Note */}
       <div className="text-center mb-6">
         <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
           <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
             🎯 AI Interviewer's Final Note
           </h3>
           <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
             "{score.finalNote}"
           </p>
         </div>
       </div>

      {/* Score Breakdown */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Breakdown
        </h3>
        
        {/* Code Quality */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Code Quality
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {score.criteria.codeQuality}/30
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBarColor(score.criteria.codeQuality)} transition-all duration-500`}
              style={{ width: getScoreBarWidth(score.criteria.codeQuality, 30) }}
            ></div>
          </div>
        </div>

        {/* Algorithm Efficiency */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Algorithm Efficiency
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {score.criteria.algorithmEfficiency}/25
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBarColor(score.criteria.algorithmEfficiency)} transition-all duration-500`}
              style={{ width: getScoreBarWidth(score.criteria.algorithmEfficiency, 25) }}
            ></div>
          </div>
        </div>

        {/* Problem Understanding */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Problem Understanding
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {score.criteria.problemUnderstanding}/20
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBarColor(score.criteria.problemUnderstanding)} transition-all duration-500`}
              style={{ width: getScoreBarWidth(score.criteria.problemUnderstanding, 20) }}
            ></div>
          </div>
        </div>

        {/* Implementation */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Implementation
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {score.criteria.implementation}/15
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBarColor(score.criteria.implementation)} transition-all duration-500`}
              style={{ width: getScoreBarWidth(score.criteria.implementation, 15) }}
            ></div>
          </div>
        </div>

        {/* Communication */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Communication
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {score.criteria.communication}/10
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBarColor(score.criteria.communication)} transition-all duration-500`}
              style={{ width: getScoreBarWidth(score.criteria.communication, 10) }}
            ></div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {timeTaken}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Minutes</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {testCasesPassed}/{totalTestCases}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Tests Passed</div>
        </div>
      </div>

      {/* Feedback */}
      {score.feedback.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Areas for Improvement
          </h3>
          <div className="space-y-2">
            {score.feedback.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">⚠️</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {score.suggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Suggestions
          </h3>
          <div className="space-y-2">
            {score.suggestions.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">💡</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Performance Summary
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>• Completed in {timeTaken} minutes</div>
          <div>• {testCasesPassed} out of {totalTestCases} test cases passed</div>
          <div>• Overall grade: <span className={`font-semibold ${InterviewScorer.getGradeColor(score.grade)}`}>{score.grade}</span></div>
          <div>• Score: <span className={`font-semibold ${InterviewScorer.getScoreColor(score.percentage)}`}>{score.percentage}%</span></div>
        </div>
      </div>
    </div>
  );
}
