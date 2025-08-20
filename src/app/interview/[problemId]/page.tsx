'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { getProblemById, Problem } from '@/data/problems';
import { getFullPythonCode, getPythonTemplate } from '@/data/pythonTemplates';
import ChatMessageRenderer from '@/components/ChatMessageRenderer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { InterviewScorer, ScoreBreakdown, ScoringContext } from '@/lib/scoring';

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
  const [activeTab, setActiveTab] = useState<'problem' | 'chat' | 'testcases' | 'score'>('problem');
  // Test execution state
  const [testResults, setTestResults] = useState<Array<{ 
    pass: boolean; 
    output: string; 
    input: string; 
    expected: unknown; 
    actual: unknown; 
  }>>([]);
  const [testRun, setTestRun] = useState(false);
        const [submitState, setSubmitState] = useState<'idle' | 'success' | 'fail' | 'submitting'>("idle");
   
                   // Interview session state
                const [sessionId, setSessionId] = useState<string>('');
                const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
                const [elapsedTime, setElapsedTime] = useState<number>(0); // in seconds
                const [isSessionActive, setIsSessionActive] = useState(false);
                const [showEndInterviewModal, setShowEndInterviewModal] = useState(false);
   
   // Chat state
   const [messages, setMessages] = useState<Array<{
     id: string;
     role: 'user' | 'assistant';
     content: string;
     timestamp: string;
   }>>([]);
   const [inputValue, setInputValue] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [chatError, setChatError] = useState<string | null>(null);
   
   // Follow-up questions state
   const [followUpQuestionsAsked, setFollowUpQuestionsAsked] = useState(false);
   const [followUpQuestionsCount, setFollowUpQuestionsCount] = useState(0);
   
   // Scoring state
   const [score, setScore] = useState<ScoreBreakdown | null>(null);
   const [showScore, setShowScore] = useState(false);
   
   // Chat scroll ref and state
   const chatMessagesRef = useRef<HTMLDivElement>(null);
   const [showScrollButton, setShowScrollButton] = useState(false);

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
 
       // Initialize interview session
       const sessionId = `session_${Date.now()}_${problemId}`;
       setSessionId(sessionId);
       setSessionStartTime(new Date());
       setIsSessionActive(true);
       
                       // Set default duration based on difficulty (in minutes) - for reference only
                let defaultDuration = 30; // 30 minutes default
                if (foundProblem.difficulty === 'Easy') defaultDuration = 20;
                else if (foundProblem.difficulty === 'Medium') defaultDuration = 45;
                else if (foundProblem.difficulty === 'Hard') defaultDuration = 60;
                
                setElapsedTime(0); // Start stopwatch at 0
 
                       // Initialize chat with welcome message
                const welcomeMessage = {
                  id: 'welcome',
                  role: 'assistant' as const,
                  content: `Welcome to your coding interview! I'm here to help guide you through solving **${foundProblem.title}**.\n\n• Think out loud about your approach\n• Ask questions about the problem\n• Request hints if you get stuck\n• Discuss time/space complexity\n\nTake your time and work through the problem step by step. Start by explaining your initial thoughts about the problem!`,
                  timestamp: new Date().toISOString(),
                };
       setMessages([welcomeMessage]);
     } else {
       setError(`Problem with ID ${problemId} not found`);
     }
     
     setLoading(false);
   }, [resolvedParams.problemId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      const scrollContainer = chatMessagesRef.current;
      
      // Small delay to ensure content is rendered, especially for code blocks
      const scrollToBottom = () => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      };
      
      // Immediate scroll for user messages, slight delay for AI responses
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'user' || isLoading) {
        scrollToBottom();
      } else {
        // Delay for AI messages to ensure syntax highlighting renders
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [messages, isLoading]); // Scroll on message updates and loading state changes

     // Auto-scroll when switching to chat tab
   useEffect(() => {
     if (activeTab === 'chat' && chatMessagesRef.current) {
       setTimeout(() => {
         if (chatMessagesRef.current) {
           chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
         }
       }, 100); // Small delay to ensure tab content is rendered
     }
   }, [activeTab]);
 
   // Session management functions
                   const handleEndInterview = async (reason: 'manual' | 'completion') => {
                  if (!isSessionActive || !problem) return;
                
                  setIsSessionActive(false);
                  const endTime = new Date();
                  
                  // Save session data
                  const sessionData = {
                    sessionId,
                    problemId: problem.id,
                    startTime: sessionStartTime,
                    endTime,
                    duration: Math.ceil((endTime.getTime() - (sessionStartTime?.getTime() || 0)) / (1000 * 60)), // in minutes
                    status: reason === 'completion' ? 'completed' : 'abandoned',
                    currentCode: code,
                    testResults,
                    messages,
                    submittedAt: submitState === 'success' ? new Date() : undefined,
                    aiEvaluation: reason === 'completion' ? 'AI evaluation completed' : undefined,
                    elapsedTime,
                    score: score || undefined,
                    followUpQuestionsAsked,
                    followUpQuestionsCount,
                  };
                
                  try {
                    // Save to localStorage for now (you can extend this to save to database)
                    const existingSessions = JSON.parse(localStorage.getItem('interviewSessions') || '[]');
                    existingSessions.push(sessionData);
                    localStorage.setItem('interviewSessions', JSON.stringify(existingSessions));
                
                    // Show appropriate message based on reason
                    let endMessage = '';
                    if (reason === 'completion') {
                      endMessage = '🎉 Interview completed successfully!';
                    } else {
                      endMessage = '👋 Interview session ended.';
                    }
                
                    // Add end message to chat
                    const endMessageObj = {
                      id: Date.now().toString(),
                      role: 'assistant' as const,
                      content: `${endMessage}\n\nSession Summary:\n• Duration: ${sessionData.duration} minutes\n• Status: ${sessionData.status}\n• Test Cases: ${testResults.filter(r => r.pass).length}/${testResults.length} passed\n• Messages: ${messages.length} exchanged`,
                      timestamp: new Date().toISOString(),
                    };
                    setMessages(prev => [...prev, endMessageObj]);
                
                    // Redirect to score tab if interview was completed and score is available
                    if (reason === 'completion' && showScore && score) {
                      // Small delay to ensure the end message is added first
                      setTimeout(() => {
                        setActiveTab('score');
                      }, 100);
                    }
                
                  } catch (error) {
                    console.error('Error saving session:', error);
                  }
                };
 
   // Timer effect
           useEffect(() => {
          if (!isSessionActive) return;
        
          const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
          }, 1000);
        
          return () => clearInterval(timer);
        }, [isSessionActive]);

  // Handle scroll detection for showing scroll-to-bottom button
  const handleScroll = () => {
    if (chatMessagesRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Manual scroll to bottom function
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Chat API function
  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading || !problem) return;

    setChatError(null);
    setIsLoading(true);

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: messageContent.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          problemContext: {
            title: problem.title,
            difficulty: problem.difficulty,
            description: problem.description,
            examples: problem.examples,
          },
          currentCode: code,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant message to chat
      setMessages(prev => [...prev, data.message]);

      // Log usage for monitoring
      if (data.metadata) {
        console.log(`💰 Chat cost: $${data.metadata.estimated_cost} | Tokens: ${data.usage.total_tokens}`);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setChatError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick action handlers
  const handleQuickAction = async (actionType: string) => {
    switch (actionType) {
      case 'hint':
        await sendMessage('Can you give me a hint for this problem?');
        break;
      case 'clarify':
        await sendMessage('Can you help me understand the problem better?');
        break;
      case 'complexity':
        await sendMessage('What should be the time and space complexity for this solution?');
        break;
    }
  };

  // Get AI hint for current solution
  const handleGetAIHint = async () => {
    if (!problem || isLoading) return;
    
    console.log('[AI Hint] Requesting hint for problem:', problem.title);
    console.log('[AI Hint] Current code length:', code.length);
    
    // Switch to chat tab to show the hint
    
    // Check if user has written any code
    const hasCode = code.trim() && code.trim() !== getFullPythonCode(problem.id).trim();
    
    if (!hasCode) {
      // If no custom code, just ask for a general hint
      const generalHintMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: `I'm just starting to work on ${problem.title} (${problem.difficulty} difficulty) and I'd like a hint to get me started. Can you give me some direction on what approach I should consider for this problem?`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, generalHintMessage]);
      setActiveTab('chat');
      
      // Send the general hint request
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, generalHintMessage],
            problemContext: {
              title: problem.title,
              difficulty: problem.difficulty,
              description: problem.description,
              examples: problem.examples,
            },
            currentCode: code,
            isHintRequest: true,
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setMessages(prev => [...prev, data.message]);
        if (data.metadata) {
          console.log(`💰 General hint cost: $${data.metadata.estimated_cost} | Tokens: ${data.usage.total_tokens}`);
        }
      } catch (error) {
        console.error('[AI Hint] General hint error:', error);
        const errorMessage = {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: '❌ Sorry, I encountered an error while getting your hint. Please try again.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      return;
    }
    
    setActiveTab('chat');
    
    // Create a message with the current code asking for a hint
    const hintMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: `I'm working on ${problem.title} (${problem.difficulty} difficulty) and I'd like a hint. Here's my current code:\n\n\`\`\`python\n${code}\n\`\`\`\n\nCan you provide me with a helpful hint or direction to move forward? Please don't give me the complete solution, just guide me in the right direction. Focus on:\n• What approach I should consider for this specific problem\n• Any specific data structures or algorithms that might help\n• Common pitfalls to avoid\n• Next logical step in my current implementation\n\nAfter giving me the hint, please ask me what I think the next step should be so I can continue working on the solution.`,
      timestamp: new Date().toISOString(),
    };
    
    // Add the hint request to chat
    setMessages(prev => [...prev, hintMessage]);
    
    // Scroll to bottom to show the new message
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // Send the hint request to AI
    try {
      console.log('[AI Hint] Sending request to chat API...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, hintMessage],
          problemContext: {
            title: problem.title,
            difficulty: problem.difficulty,
            description: problem.description,
            examples: problem.examples,
          },
          currentCode: code,
          isHintRequest: true, // Flag to indicate this is a hint request
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('[AI Hint] Received response from AI');
      
      // Add AI hint response to chat
      setMessages(prev => [...prev, data.message]);

      // Log usage for monitoring
      if (data.metadata) {
        console.log(`💰 Hint cost: $${data.metadata.estimated_cost} | Tokens: ${data.usage.total_tokens}`);
      }

      // Scroll to bottom to show the AI response
      setTimeout(() => {
        scrollToBottom();
      }, 100);

    } catch (error) {
      console.error('[AI Hint] Error:', error);
      // Add error message to chat
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: '❌ Sorry, I encountered an error while getting your hint. Please try again. You can also try typing your question directly in the chat.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Scroll to bottom to show the error message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
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

  // Run test cases with Judge0
  const handleRunTestCases = async () => {
    if (!problem) {
      console.warn('[UI] No problem available');
      return;
    }
    
    setTestRun(true);
    setActiveTab('testcases');
    setTestResults([]);
    
        try {
      // Extract function name from the problem template or code
      const template = getPythonTemplate(problem.id);
      let funcName = template.functionSignature.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/)?.[1];
      
      console.log('[DEBUG] Template function signature:', template.functionSignature);
      console.log('[DEBUG] Extracted function name:', funcName);
      console.log('[DEBUG] Problem ID:', problem.id);
      
      if (!funcName) {
        // Fallback: try to find any function in the code
        const funcMatch = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        funcName = funcMatch ? funcMatch[1] : 'solution';
        console.log('[DEBUG] Fallback function name:', funcName);
      }
      
      const results = [];
      
      for (const [i, testCase] of problem.testCases.entries()) {
        try {
          console.log(`[DEBUG] Running test case ${i + 1}:`, testCase);
          
          // Create test runner code
          const testCode = `
${code}

# Test case execution
if __name__ == "__main__":
    import json
    import sys
    
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    # Create solution instance and run
    solution = Solution()
    
    # Extract parameters based on problem type
    if ${problem.id} == 1:  # Two Sum
        nums = input_data["nums"]
        target = input_data["target"]
        result = solution.${funcName}(nums, target)
    elif ${problem.id} == 2:  # Add Two Numbers
        # Convert arrays to ListNode objects
        def array_to_listnode(arr):
            if not arr:
                return None
            head = ListNode(arr[0])
            current = head
            for val in arr[1:]:
                current.next = ListNode(val)
                current = current.next
            return head
        
        def listnode_to_array(node):
            arr = []
            current = node
            while current is not None:
                arr.append(current.val)
                current = current.next
            return arr
        
        l1 = array_to_listnode(input_data["l1"])
        l2 = array_to_listnode(input_data["l2"])
        result = solution.${funcName}(l1, l2)
        # Convert ListNode back to array
        result = listnode_to_array(result)
    else:
        # Generic case - pass all input as kwargs
        result = solution.${funcName}(**input_data)
    
    # Output result as JSON
    print(json.dumps(result))
`;

          console.log('[DEBUG] Test code to execute:', testCode);
          
                     // Execute via Judge0
           console.log(`[DEBUG] Executing test case ${i + 1} with input:`, testCase.input);
           const response = await fetch('/api/execute', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               source_code: testCode,
               language_id: 71, // Python 3
               stdin: JSON.stringify(testCase.input)
             })
           });

          if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
          }

          const executionResult = await response.json();
          console.log('[DEBUG] Judge0 execution result:', executionResult);
          
                     // Both status 3 (Accepted) and 4 (Wrong Answer) mean the code executed successfully
           if (executionResult.status.id === 3 || executionResult.status.id === 4) {
             try {
               const actual = JSON.parse(executionResult.stdout.trim());
               const pass = deepEqual(actual, testCase.expectedOutput);
               
               console.log(`[DEBUG] Adding result for test case ${i + 1}:`, { pass, actual, expected: testCase.expectedOutput });
               results.push({
                 pass,
                 output: `Input: ${JSON.stringify(testCase.input)}\nExpected: ${JSON.stringify(testCase.expectedOutput)}\nActual: ${JSON.stringify(actual)}${!pass ? '\n❌ Test Failed' : '\n✅ Test Passed'}`,
                 input: JSON.stringify(testCase.input),
                 expected: testCase.expectedOutput,
                 actual: actual
               });
             } catch {
               results.push({
                 pass: false,
                 output: `Error: Invalid output format. Raw output: ${executionResult.stdout}`,
                 input: JSON.stringify(testCase.input),
                 expected: testCase.expectedOutput,
                 actual: null
               });
             }
           } else {
             // Handle compilation/runtime errors
             const errorMessage = executionResult.stderr || executionResult.compile_output || `Status: ${executionResult.status.description}`;
             results.push({
               pass: false,
               output: `Error: ${errorMessage}`,
               input: JSON.stringify(testCase.input),
               expected: testCase.expectedOutput,
               actual: null
             });
           }
        } catch (e) {
          console.error(`[DEBUG] Test case ${i + 1} failed:`, e);
          results.push({
            pass: false,
            output: `Error: ${e instanceof Error ? e.message : String(e)}`,
            input: JSON.stringify(testCase.input),
            expected: testCase.expectedOutput,
            actual: null
          });
        }
      }
      
             console.log('[DEBUG] Final test results:', results);
       setTestResults(results);
       
       // Check if all tests passed
       const allPassed = results.every(r => r.pass);
       console.log('[DEBUG] All tests passed:', allPassed);
       if (allPassed) {
         setSubmitState('success');
       } else {
         setSubmitState('fail');
       }
      
    } catch (error) {
      console.error('Test execution error:', error);
      setTestResults([{ 
        pass: false, 
        output: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        input: '',
        expected: null,
        actual: null
      }]);
      setSubmitState('fail');
         } finally {
       // Don't set testRun to false - keep it true so test results remain visible
       // setTestRun(false);
     }
  };



  // Helper for deep equality comparison
  const deepEqual = (a: unknown, b: unknown): boolean => {
    console.log('[DEBUG] deepEqual called with:', { a, b });
    
    if (a === b) {
      console.log('[DEBUG] deepEqual: exact match, returning true');
      return true;
    }
    if (a == null || b == null) {
      console.log('[DEBUG] deepEqual: one value is null/undefined, returning false');
      return false;
    }
    if (typeof a !== typeof b) {
      console.log('[DEBUG] deepEqual: type mismatch:', { typeA: typeof a, typeB: typeof b });
      return false;
    }
    
    if (typeof a === 'object') {
      const isArrayA = Array.isArray(a);
      const isArrayB = Array.isArray(b);
      console.log('[DEBUG] deepEqual: object comparison:', { isArrayA, isArrayB });
      
      // Special case: empty object {} vs empty array []
      if (isArrayA !== isArrayB) {
        if (isArrayA && !isArrayB && Object.keys(b as Record<string, unknown>).length === 0) {
          // a is array, b is empty object - treat as equal if a is empty
          if (a.length === 0) {
            console.log('[DEBUG] deepEqual: empty array equals empty object, returning true');
            return true;
          }
        } else if (!isArrayA && isArrayB && Object.keys(a as Record<string, unknown>).length === 0) {
          // a is empty object, b is array - treat as equal if b is empty
          if ((b as unknown[]).length === 0) {
            console.log('[DEBUG] deepEqual: empty object equals empty array, returning true');
            return true;
          }
        }
        console.log('[DEBUG] deepEqual: array vs object mismatch, returning false');
        return false;
      }
      
      if (isArrayA) {
        const lengthA = a.length;
        const lengthB = (b as unknown[]).length;
        console.log('[DEBUG] deepEqual: array length comparison:', { lengthA, lengthB });
        
        if (lengthA !== lengthB) {
          console.log('[DEBUG] deepEqual: array length mismatch, returning false');
          return false;
        }
        
        for (let i = 0; i < lengthA; i++) {
          console.log('[DEBUG] deepEqual: comparing array element', i, ':', { a: a[i], b: (b as unknown[])[i] });
          if (!deepEqual(a[i], (b as unknown[])[i])) {
            console.log('[DEBUG] deepEqual: array element mismatch at index', i);
            return false;
          }
        }
        console.log('[DEBUG] deepEqual: all array elements match, returning true');
        return true;
      }
      
      const keysA = Object.keys(a as Record<string, unknown>);
      const keysB = Object.keys(b as Record<string, unknown>);
      console.log('[DEBUG] deepEqual: object keys comparison:', { keysA, keysB });
      
      if (keysA.length !== keysB.length) {
        console.log('[DEBUG] deepEqual: object key count mismatch, returning false');
        return false;
      }
      
      for (const key of keysA) {
        if (!keysB.includes(key)) {
          console.log('[DEBUG] deepEqual: missing key in second object:', key);
          return false;
        }
        console.log('[DEBUG] deepEqual: comparing object property:', key, ':', { a: (a as Record<string, unknown>)[key], b: (b as Record<string, unknown>)[key] });
        if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
          console.log('[DEBUG] deepEqual: object property mismatch at key:', key);
          return false;
        }
      }
      console.log('[DEBUG] deepEqual: all object properties match, returning true');
      return true;
    }
    
    console.log('[DEBUG] deepEqual: primitive comparison, returning false');
    return false;
  };

     // Submit solution
   const handleSubmit = async () => {
     if (testResults.length === 0) return;
     const allPassed = testResults.every(r => r.pass);
     setActiveTab('chat');
     if (allPassed) {
       setSubmitState('submitting');
       
       // Send solution to AI for evaluation
       try {
         const evaluationMessage = {
           id: Date.now().toString(),
           role: 'user' as const,
           content: `I've completed the solution for ${problem.title}. Here's my code:\n\n\`\`\`python\n${code}\n\`\`\`\n\nAll test cases passed. Can you evaluate my solution and provide feedback on:\n1. Code quality and readability\n2. Time and space complexity\n3. Alternative approaches\n4. Final thoughts and questions to wrap up this interview?`,
           timestamp: new Date().toISOString(),
         };
         
         setMessages(prev => [...prev, evaluationMessage]);
         setInputValue('');
         
         // Get AI evaluation
         const response = await fetch('/api/chat', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             messages: [...messages, evaluationMessage],
             problemContext: {
               title: problem.title,
               difficulty: problem.difficulty,
               description: problem.description,
               examples: problem.examples,
             },
             currentCode: code,
             isSolutionSubmission: true, // Flag to indicate this is a solution submission
           }),
         });
 
         if (!response.ok) {
           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
         }
 
         const data = await response.json();
 
         if (data.error) {
           throw new Error(data.error);
         }
 
                  // Add AI evaluation to chat
         setMessages(prev => [...prev, data.message]);

         // Log usage for monitoring
         if (data.metadata) {
           console.log(`💰 Solution evaluation cost: $${data.metadata.estimated_cost} | Tokens: ${data.usage.total_tokens}`);
         }

         // Check if follow-up questions were asked
         const content = data.message.content;
         const followUpQuestionMatches = content.match(/Follow-up Question \d+:/g);
         if (followUpQuestionMatches) {
           setFollowUpQuestionsAsked(true);
           setFollowUpQuestionsCount(followUpQuestionMatches.length);
           console.log(`[Follow-up] AI asked ${followUpQuestionMatches.length} follow-up questions`);
         }

         // Calculate score from AI evaluation
         try {
           const scoringContext: ScoringContext = {
             problemDifficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
             timeTaken: Math.ceil(elapsedTime / 60),
             testCasesPassed: testResults.filter(r => r.pass).length,
             totalTestCases: problem.testCases.length,
             codeLength: code.length,
             hasComments: code.includes('#') || code.includes('"""') || code.includes("'''"),
             hasErrorHandling: code.includes('try:') || code.includes('except:') || code.includes('if __name__')
           };
           
           const calculatedScore = InterviewScorer.calculateScore(content, scoringContext);
           setScore(calculatedScore);
           setShowScore(true);
           console.log('[Scoring] Calculated score:', calculatedScore);
         } catch (error) {
           console.error('[Scoring] Error calculating score:', error);
         }

         // Set success state after evaluation
         setSubmitState('success');
         
         // Switch to chat tab to show the evaluation
         setActiveTab('chat');
 
       } catch (error) {
         console.error('Solution evaluation error:', error);
         // Add error message to chat
         const errorMessage = {
           id: Date.now().toString(),
           role: 'assistant' as const,
           content: '❌ Sorry, I encountered an error while evaluating your solution. Please try again.',
           timestamp: new Date().toISOString(),
         };
         setMessages(prev => [...prev, errorMessage]);
       }
     } else {
       setSubmitState('fail');
     }
   };

     // Helper for showing banner
   const renderBanner = () => {
     if (submitState === 'submitting') {
       return (
         <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded mb-4 text-center">
           <div className="flex items-center justify-center gap-2">
             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
             <span className="font-medium">🤖 AI is evaluating your solution...</span>
           </div>
         </div>
       );
     }
     if (submitState === 'success') {
       return (
         <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded mb-4 text-center">
           <div className="font-bold mb-1">🎉 Congratulations! All test cases passed.</div>
           <div className="text-sm font-normal">
             Your solution has been evaluated by the AI. Check the chat tab for detailed feedback and follow-up questions!
             {showScore && (
               <span className="block mt-2">
                 📊 <button 
                   onClick={() => setActiveTab('score')} 
                   className="underline hover:no-underline font-medium"
                 >
                   View your detailed score and analysis
                 </button>
                 <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                   (You&apos;ll be automatically redirected to the score tab when ending the interview)
                 </div>
               </span>
             )}
           </div>
         </div>
       );
     }
     return null;
   };

      // Debug panel for Judge0 state
    const renderJudge0Debug = () => (
      <div style={{ position: 'fixed', bottom: 0, right: 0, background: '#222', color: '#fff', padding: 12, zIndex: 9999, fontSize: 12, borderRadius: 8, opacity: 0.9 }}>
        <div><b>Judge0 Debug</b></div>
        <div>Test Run: {String(testRun)}</div>
        <div>Test Results: {testResults.length}</div>
      </div>
    );

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
             <div className="mt-3 md:mt-0 flex flex-col md:flex-row gap-3 items-center">
               {/* Timer Display */}
                               {isSessionActive && (
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Elapsed Time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
               
               {/* End Interview Button */}
               {isSessionActive && (
                 <button
                   onClick={() => setShowEndInterviewModal(true)}
                   className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                 >
                   🏁 End Interview
                 </button>
               )}
               
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

             {/* Banner for submission result */}
       {renderBanner()}
       
       {/* Time Warning Banner */}
       
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
                {showScore && (
                  <button
                    onClick={() => setActiveTab('score')}
                    className={`flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                      activeTab === 'score'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    📊 Score
                  </button>
                )}
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
                             {problem.testCases.length} test case{problem.testCases.length !== 1 ? 's' : ''}
                           </span>
                           {testRun && testResults.length === 0 && (
                             <div className="flex items-center gap-2">
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                               <span className="text-sm text-blue-600 dark:text-blue-400">Running tests...</span>
                             </div>
                           )}
                         </div>
                       </div>
                       {/* Session Status */}
                       {isSessionActive && (
                         <div className="mt-2 flex items-center gap-2 text-sm">
                           <div className="flex items-center gap-1">
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                             <span className="text-green-600 dark:text-green-400">Session Active</span>
                           </div>
                           <span className="text-gray-400">•</span>
                           <span className="text-gray-600 dark:text-gray-400">
                             Started: {sessionStartTime?.toLocaleTimeString()}
                           </span>
                         </div>
                       )}
                     </div>

                    {/* Test Cases Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Individual Test Cases */}
                      {problem.testCases.map((testCase, index) => {
                        const result = testResults[index];
                                                 let status = 'Not Run', color = 'bg-gray-400', output = 'Run code to see output...';
                         if (result !== undefined) {
                           status = result.pass ? 'Passed' : 'Failed';
                           color = result.pass ? 'bg-green-500' : 'bg-red-500';
                           output = result.output;
                         } else if (testRun && testResults.length > 0) {
                           // Tests are running but this specific test case doesn't have a result yet
                           status = 'Running...';
                           color = 'bg-yellow-500';
                           output = 'Test case is being executed...';
                         }
                        return (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                            {/* Test Case Header */}
                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  Test Case {index + 1}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${color}`}></div>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{status}</span>
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
                                  <code className="text-gray-900 dark:text-gray-100">{JSON.stringify(testCase.input, null, 2)}</code>
                                </div>
                              </div>
                              {/* Expected Output */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Expected Output:
                                </label>
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 font-mono text-sm">
                                  <code className="text-gray-900 dark:text-gray-100">{JSON.stringify(testCase.expectedOutput, null, 2)}</code>
                                </div>
                              </div>
                                                             {/* Actual Output */}
                               <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                   Your Output:
                                 </label>
                                 <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 font-mono text-sm min-h-[3rem]">
                                   <pre className="whitespace-pre-wrap text-xs">
                                     <span className={result && !result.pass ? 'text-red-500' : result && result.pass ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'}>
                                       {output}
                                     </span>
                                   </pre>
                                 </div>
                               </div>
                              {/* Explanation (if available) */}
                              {testCase.explanation && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Explanation:
                                  </label>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
                                    {testCase.explanation}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Overall Results Summary */}
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🧪</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              {testRun ? 'Test Results' : 'Ready to Test Your Code'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {testRun
                                ? `Passed: ${testResults.filter(r => r.pass).length} | Failed: ${testResults.filter(r => !r.pass).length} | Total: ${problem.testCases.length}`
                                : 'Click "Run Test Cases" in the code editor to see results here'}
                            </p>
                            {testRun && testResults.length > 0 && (
                              <div className="mt-3">
                                <div className="flex justify-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-green-600 dark:text-green-400">
                                      {testResults.filter(r => r.pass).length} Passed
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-red-600 dark:text-red-400">
                                      {testResults.filter(r => !r.pass).length} Failed
                                    </span>
                                  </div>
                                </div>
                                                                 {testResults.every(r => r.pass) && (
                                   <div className="mt-2 text-green-600 dark:text-green-400 font-medium">
                                     🎉 All tests passed! Your solution is correct.
                                   </div>
                                 )}
                                 {testResults.every(r => r.pass) && submitState === 'idle' && (
                                   <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                     <div className="text-blue-800 dark:text-blue-200 text-sm">
                                       <div className="font-medium mb-1">🚀 Ready to Submit?</div>
                                       <div>Click the &quot;Submit Solution&quot; button in the code editor to get AI feedback on your code quality, complexity analysis, and final interview questions!</div>
                                     </div>
                                   </div>
                                 )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                                             {/* Session Summary */}
                       {isSessionActive && (
                         <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                           <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">Session Information</h4>
                           <div className="grid grid-cols-2 gap-4 text-sm">
                             <div>
                               <span className="text-blue-600 dark:text-blue-400">Session ID:</span>
                               <div className="font-mono text-blue-800 dark:text-blue-200 text-xs">{sessionId}</div>
                             </div>
                                                   <div>
                        <span className="text-blue-600 dark:text-blue-400">Elapsed Time:</span>
                        <div className="font-mono text-blue-800 dark:text-blue-200">
                          {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                             <div>
                               <span className="text-blue-600 dark:text-blue-400">Started:</span>
                               <div className="font-mono text-blue-800 dark:text-blue-200 text-xs">
                                 {sessionStartTime?.toLocaleString()}
                               </div>
                             </div>
                             <div>
                               <span className="text-blue-600 dark:text-blue-400">Status:</span>
                               <div className="font-mono text-blue-800 dark:text-blue-200">
                                 <span className="inline-flex items-center gap-1">
                                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                   Active
                                 </span>
                               </div>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                {/* Score Tab */}
                {activeTab === 'score' && showScore && score && (
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interview Score & Analysis</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <ScoreDisplay
                        score={score}
                        problemTitle={problem.title}
                        difficulty={problem.difficulty}
                        timeTaken={Math.ceil(elapsedTime / 60)}
                        testCasesPassed={testResults.filter(r => r.pass).length}
                        totalTestCases={problem.testCases.length}
                      />
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
                           {submitState === 'success' && (
                             <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                               ✅ Solution Submitted
                             </div>
                           )}
                           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                           <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
                         </div>
                       </div>
                     </div>

                    {/* Chat Messages */}
                    <div 
                      ref={chatMessagesRef}
                      onScroll={handleScroll}
                      className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth relative"
                    >
                      {messages.map((message) => (
                        <div key={message.id} className={`flex items-start gap-3 ${
                          message.role === 'user' ? 'justify-end' : ''
                        }`}>
                          {message.role === 'assistant' && (
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white">🤖</span>
                            </div>
                          )}
                          
                          <div className={`rounded-lg p-4 max-w-[85%] ${
                            message.role === 'user' 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200'
                          }`}>
                            <ChatMessageRenderer 
                              content={message.content} 
                              role={message.role}
                              onCodeInsert={(code) => setCode(code)}
                            />
                            <div className="text-xs opacity-70 mt-3">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>

                          {message.role === 'user' && (
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white">👤</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Loading indicator */}
                      {isLoading && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white">🤖</span>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-[85%]">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <span className="text-blue-700 dark:text-blue-300 text-sm ml-2">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error message */}
                      {chatError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-red-500">❌</span>
                            <span className="text-red-700 dark:text-red-300 text-sm">{chatError}</span>
                          </div>
                        </div>
                      )}

                      {/* Scroll to Bottom Button */}
                      {showScrollButton && (
                        <div className="absolute bottom-4 right-4">
                          <button
                            onClick={scrollToBottom}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                            title="Scroll to bottom"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }} className="flex gap-3 mb-3">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Type your thoughts, questions, or request a hint..."
                          disabled={isLoading}
                          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        />
                        <button 
                          type="submit"
                          disabled={!inputValue.trim() || isLoading}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                        >
                          {isLoading ? '...' : 'Send'}
                        </button>
                      </form>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => handleQuickAction('hint')}
                          disabled={isLoading}
                          className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          💡 Get Hint
                        </button>
                        <button 
                          onClick={() => handleQuickAction('clarify')}
                          disabled={isLoading}
                          className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          🔍 Clarify Problem
                        </button>
                        <button 
                          onClick={() => handleQuickAction('complexity')}
                          disabled={isLoading}
                          className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors disabled:opacity-50"
                        >
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
                    onClick={handleRunTestCases}
                  >
                    🧪 Run Test Cases
                  </button>
                  <button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    disabled={!isEditorReady || isLoading}
                    onClick={handleGetAIHint}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto mb-1"></div>
                        Getting Hint...
                      </>
                    ) : (
                      '🤖 Get AI Hint'
                    )}
                  </button>
                                     <button 
                     className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                     disabled={!isEditorReady || !testRun || testResults.length !== problem.testCases.length || submitState === 'submitting'}
                     onClick={handleSubmit}
                   >
                     {submitState === 'submitting' ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto mb-1"></div>
                         Evaluating Solution...
                       </>
                     ) : (
                       '✅ Submit Solution'
                     )}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
                             {renderJudge0Debug()}
 
       {/* End Interview Confirmation Modal */}
       {showEndInterviewModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
             <div className="text-center">
               <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="text-2xl">🏁</span>
               </div>
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                 End Interview Session?
               </h3>
               <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                 Are you sure you want to end this interview session? This action cannot be undone.
                 {showScore && score && (
                   <span className="block mt-2 text-blue-600 dark:text-blue-400">
                     📊 You&apos;ll be redirected to your detailed score and analysis.
                   </span>
                 )}
               </p>
               <div className="flex gap-3 justify-center">
                 <button
                   onClick={() => setShowEndInterviewModal(false)}
                   className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={() => {
                     setShowEndInterviewModal(false);
                     handleEndInterview('manual');
                   }}
                   className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                 >
                   End Interview
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
}