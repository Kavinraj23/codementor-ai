export interface ScoringCriteria {
  codeQuality: number;      // 0-30 points
  algorithmEfficiency: number; // 0-25 points
  problemUnderstanding: number; // 0-20 points
  implementation: number;    // 0-15 points
  communication: number;     // 0-10 points
}

export interface ScoreBreakdown {
  total: number;
  percentage: number;
  grade: string;
  criteria: ScoringCriteria;
  feedback: string[];
  suggestions: string[];
  finalNote: string;
}

export interface ScoringContext {
  problemDifficulty: 'Easy' | 'Medium' | 'Hard';
  timeTaken: number; // in minutes
  testCasesPassed: number;
  totalTestCases: number;
  codeLength: number;
  hasComments: boolean;
  hasErrorHandling: boolean;
}

export class InterviewScorer {
  private static readonly DIFFICULTY_MULTIPLIERS = {
    Easy: 1.0,
    Medium: 0.9,
    Hard: 0.8
  };

  private static readonly GRADE_THRESHOLDS = {
    A: 90,
    B: 80,
    C: 70,
    D: 60,
    F: 0
  };

  static calculateScore(
    aiEvaluation: string,
    context: ScoringContext
  ): ScoreBreakdown {
    // Parse AI evaluation to extract scores
    const scores = this.parseAIEvaluation(aiEvaluation);
    
    // Apply difficulty adjustments
    const adjustedScores = this.applyDifficultyAdjustments(scores, context.problemDifficulty);
    
    // Calculate total and percentage
    const total = Object.values(adjustedScores).reduce((sum, score) => sum + score, 0);
    const percentage = Math.round((total / 100) * 100);
    
    // Determine grade
    const grade = this.calculateGrade(percentage);
    
    // Generate feedback and suggestions
    const feedback = this.generateFeedback(adjustedScores, context);
    const suggestions = this.generateSuggestions(adjustedScores, context);
    
         // Extract final performance note from AI evaluation
     const finalNote = this.extractFinalNote(aiEvaluation);
     
     return {
       total,
       percentage,
       grade,
       criteria: adjustedScores,
       feedback,
       suggestions,
       finalNote
     };
  }

  private static parseAIEvaluation(evaluation: string): ScoringCriteria {
    // Default scores - AI will override these based on its analysis
    const defaultScores: ScoringCriteria = {
      codeQuality: 20,
      algorithmEfficiency: 18,
      problemUnderstanding: 15,
      implementation: 10,
      communication: 6
    };

    try {
      // Look for the scoring format: "SCORE: Code Quality: X/30, Algorithm Efficiency: Y/25, ..."
      const scoreMatch = evaluation.match(/SCORE:\s*(.*?)(?=\n|$)/i);
      if (scoreMatch) {
        const scoreText = scoreMatch[1];
        
        // Extract individual scores
        const codeQualityMatch = scoreText.match(/Code Quality:\s*(\d+)\/30/i);
        const algorithmMatch = scoreText.match(/Algorithm Efficiency:\s*(\d+)\/25/i);
        const understandingMatch = scoreText.match(/Problem Understanding:\s*(\d+)\/20/i);
        const implementationMatch = scoreText.match(/Implementation:\s*(\d+)\/15/i);
        const communicationMatch = scoreText.match(/Communication:\s*(\d+)\/10/i);

        if (codeQualityMatch && algorithmMatch && understandingMatch && implementationMatch && communicationMatch) {
          return {
            codeQuality: parseInt(codeQualityMatch[1]),
            algorithmEfficiency: parseInt(algorithmMatch[1]),
            problemUnderstanding: parseInt(understandingMatch[1]),
            implementation: parseInt(implementationMatch[1]),
            communication: parseInt(communicationMatch[1])
          };
        }
      }

      // Fallback: try to extract scores from text analysis
      const scores = this.analyzeTextForScores(evaluation);
      if (scores) return scores;

    } catch (error) {
      console.error('Error parsing AI evaluation:', error);
    }

    // Return default scores if parsing fails
    return defaultScores;
  }

  private static analyzeTextForScores(evaluation: string): ScoringCriteria | null {
    const lowerEvaluation = evaluation.toLowerCase();
    
    // Analyze code quality indicators
    let codeQuality = 20;
    if (lowerEvaluation.includes('excellent code quality') || lowerEvaluation.includes('very clean code')) codeQuality = 28;
    else if (lowerEvaluation.includes('good code quality') || lowerEvaluation.includes('clean code')) codeQuality = 24;
    else if (lowerEvaluation.includes('poor code quality') || lowerEvaluation.includes('messy code')) codeQuality = 12;
    else if (lowerEvaluation.includes('bad code quality')) codeQuality = 8;

    // Analyze algorithm efficiency
    let algorithmEfficiency = 18;
    if (lowerEvaluation.includes('optimal solution') || lowerEvaluation.includes('best approach')) algorithmEfficiency = 23;
    else if (lowerEvaluation.includes('good approach') || lowerEvaluation.includes('efficient')) algorithmEfficiency = 20;
    else if (lowerEvaluation.includes('suboptimal') || lowerEvaluation.includes('inefficient')) algorithmEfficiency = 12;
    else if (lowerEvaluation.includes('poor algorithm')) algorithmEfficiency = 8;

    // Analyze problem understanding
    let problemUnderstanding = 15;
    if (lowerEvaluation.includes('excellent understanding') || lowerEvaluation.includes('fully understood')) problemUnderstanding = 18;
    else if (lowerEvaluation.includes('good understanding')) problemUnderstanding = 16;
    else if (lowerEvaluation.includes('partial understanding')) problemUnderstanding = 12;
    else if (lowerEvaluation.includes('misunderstood')) problemUnderstanding = 8;

    // Analyze implementation
    let implementation = 10;
    if (lowerEvaluation.includes('bug-free') || lowerEvaluation.includes('correctly implemented')) implementation = 13;
    else if (lowerEvaluation.includes('mostly correct')) implementation = 11;
    else if (lowerEvaluation.includes('some bugs') || lowerEvaluation.includes('implementation issues')) implementation = 7;
    else if (lowerEvaluation.includes('many bugs')) implementation = 4;

    // Analyze communication
    let communication = 6;
    if (lowerEvaluation.includes('excellent communication') || lowerEvaluation.includes('well documented')) communication = 9;
    else if (lowerEvaluation.includes('good communication')) communication = 7;
    else if (lowerEvaluation.includes('poor communication') || lowerEvaluation.includes('unclear')) communication = 4;
    else if (lowerEvaluation.includes('no communication')) communication = 2;

    return {
      codeQuality,
      algorithmEfficiency,
      problemUnderstanding,
      implementation,
      communication
    };
  }

  private static applyDifficultyAdjustments(
    scores: ScoringCriteria,
    difficulty: 'Easy' | 'Medium' | 'Hard'
  ): ScoringCriteria {
    const multiplier = this.DIFFICULTY_MULTIPLIERS[difficulty];
    
    return {
      codeQuality: Math.round(scores.codeQuality * multiplier),
      algorithmEfficiency: Math.round(scores.algorithmEfficiency * multiplier),
      problemUnderstanding: Math.round(scores.problemUnderstanding * multiplier),
      implementation: Math.round(scores.implementation * multiplier),
      communication: Math.round(scores.communication * multiplier)
    };
  }

  private static calculateGrade(percentage: number): string {
    if (percentage >= this.GRADE_THRESHOLDS.A) return 'A';
    if (percentage >= this.GRADE_THRESHOLDS.B) return 'B';
    if (percentage >= this.GRADE_THRESHOLDS.C) return 'C';
    if (percentage >= this.GRADE_THRESHOLDS.D) return 'D';
    return 'F';
  }

  private static generateFeedback(scores: ScoringCriteria, context: ScoringContext): string[] {
    const feedback: string[] = [];
    
    if (scores.codeQuality < 20) {
      feedback.push("Consider improving code readability and structure");
    }
    if (scores.algorithmEfficiency < 18) {
      feedback.push("Look for more optimal algorithms or data structures");
    }
    if (scores.problemUnderstanding < 15) {
      feedback.push("Ensure you fully understand the problem requirements");
    }
    if (scores.implementation < 10) {
      feedback.push("Focus on writing bug-free, robust code");
    }
    if (scores.communication < 6) {
      feedback.push("Add comments and clear variable names");
    }

    // Context-specific feedback
    if (context.timeTaken > 45) {
      feedback.push("Work on improving your problem-solving speed");
    }
    if (context.testCasesPassed < context.totalTestCases) {
      feedback.push("Ensure all test cases pass before submission");
    }

    return feedback;
  }

  private static generateSuggestions(scores: ScoringCriteria, context: ScoringContext): string[] {
    const suggestions: string[] = [];
    
    if (scores.codeQuality < 20) {
      suggestions.push("Use consistent naming conventions");
      suggestions.push("Break complex functions into smaller ones");
    }
    if (scores.algorithmEfficiency < 18) {
      suggestions.push("Study time/space complexity analysis");
      suggestions.push("Practice with different data structures");
    }
    if (scores.problemUnderstanding < 15) {
      suggestions.push("Always clarify requirements before coding");
      suggestions.push("Consider edge cases early");
    }
    if (scores.implementation < 10) {
      suggestions.push("Write tests before implementing");
      suggestions.push("Handle error cases gracefully");
    }
    if (scores.communication < 6) {
      suggestions.push("Add docstrings to functions");
      suggestions.push("Explain complex logic with comments");
    }

    return suggestions;
  }

  static getScoreColor(percentage: number): string {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  static getGradeColor(grade: string): string {
    switch (grade) {
      case 'A': return 'text-green-600 dark:text-green-400';
      case 'B': return 'text-blue-600 dark:text-blue-400';
      case 'C': return 'text-yellow-600 dark:text-yellow-400';
      case 'D': return 'text-orange-600 dark:text-orange-400';
      case 'F': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  private static extractFinalNote(evaluation: string): string {
    try {
      // Look for the final note format: "FINAL NOTE: [content]"
      const finalNoteMatch = evaluation.match(/FINAL NOTE:\s*(.*?)(?=\n|$)/i);
      if (finalNoteMatch) {
        return finalNoteMatch[1].trim();
      }

      // Fallback: try to find a concluding sentence
      const sentences = evaluation.split(/[.!?]+/);
      const lastSentence = sentences[sentences.length - 2]?.trim(); // -2 because last might be empty
      
      if (lastSentence && lastSentence.length > 20) {
        return lastSentence;
      }

      // Default encouraging note
      return "Good effort on this problem! Keep practicing to improve your coding skills.";
    } catch (error) {
      console.error('Error extracting final note:', error);
      return "Good effort on this problem! Keep practicing to improve your coding skills.";
    }
  }
}
