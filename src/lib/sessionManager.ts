import { IInterviewSession } from '@/models/Interview';

export interface SessionData {
  sessionId: string;
  problemId: number;
  problemTitle: string;
  problemDifficulty: 'Easy' | 'Medium' | 'Hard';
  currentCode: string;
  testResults: Array<{
    pass: boolean;
    output: string;
    input: string;
    expected: unknown;
    actual: unknown;
  }>;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  elapsedTime: number;
  status: 'active' | 'completed' | 'incomplete';
  performanceMetrics?: {
    testCasesPassed: number;
    totalTestCases: number;
    successRate: number;
    timeEfficiency: number;
    codeQuality: number;
  };
  endTime?: Date;
  duration?: number;
  submittedAt?: Date;
  aiEvaluation?: string;
}

// Create new session
export async function createSession(sessionData: Omit<SessionData, 'sessionId'>): Promise<string> {
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

// Get session by ID
export async function getSession(sessionId: string): Promise<SessionData | null> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Session not found
      }
      throw new Error(`Failed to fetch session: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
}

// Update session
export async function updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update session failed:', errorText);
      throw new Error(`Failed to update session: ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

// Local storage utilities
export const SESSION_STORAGE_KEY = 'codementor_interview_session';

export function saveSessionToStorage(sessionId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
}

export function getSessionFromStorage(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  }
  return null;
}

export function clearSessionFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

// Auto-save utilities
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Performance metrics calculation
export function calculatePerformanceMetrics(
  testResults: SessionData['testResults'],
  elapsedTime: number,
  problemDifficulty: string
): {
  testCasesPassed: number;
  totalTestCases: number;
  successRate: number;
  timeEfficiency: number;
  codeQuality: number;
} {
  const totalTestCases = testResults.length;
  const testCasesPassed = testResults.filter(result => result.pass).length;
  const successRate = totalTestCases > 0 ? (testCasesPassed / totalTestCases) * 100 : 0;
  
  // Time efficiency based on difficulty and time taken
  const difficultyMultipliers = { Easy: 10, Medium: 15, Hard: 20 };
  const expectedTime = difficultyMultipliers[problemDifficulty as keyof typeof difficultyMultipliers] || 15;
  const timeEfficiency = Math.max(0, Math.min(100, (expectedTime / (elapsedTime / 60)) * 100));
  
  // Simple code quality metric (can be enhanced later)
  const codeQuality = Math.min(100, Math.max(0, 100 - (elapsedTime / 60) * 2));
  
  return {
    testCasesPassed,
    totalTestCases,
    successRate,
    timeEfficiency,
    codeQuality
  };
}
