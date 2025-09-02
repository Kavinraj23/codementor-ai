'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { getProblemById, Problem } from '@/data/problems';
import { getFullPythonCode, getPythonTemplate } from '@/data/pythonTemplates';
import ChatMessageRenderer from '@/components/ChatMessageRenderer';
import MicrophonePermission from '@/components/MicrophonePermission';
import { 
  createSession, 
  getSession, 
  updateSession, 
  deleteSession,
  saveSessionToStorage,
  getSessionFromStorage,
  clearSessionFromStorage,
  debounce,
  calculatePerformanceMetrics,
  type SessionData
} from '@/lib/sessionManager';



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
                const [isSessionLoading, setIsSessionLoading] = useState(false);
                const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
   
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
   

   
   // Chat scroll ref and state
   const chatMessagesRef = useRef<HTMLDivElement>(null);
   const [showScrollButton, setShowScrollButton] = useState(false);
   
   // Microphone permission state
   const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);
   const [showMicrophonePrompt, setShowMicrophonePrompt] = useState(true); // Start as true - require permission to start
   
   // Voice interaction state
   const [isAISpeaking, setIsAISpeaking] = useState(false);
   const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
   const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
   const [ttsEnabled, setTtsEnabled] = useState(true); // TTS toggle
   
   // STT (Speech-to-Text) state
   const [isListening, setIsListening] = useState(false);
   const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
   const [transcript, setTranscript] = useState('');
   const [recognitionError, setRecognitionError] = useState<string | null>(null);
   const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
   const [recordingDuration, setRecordingDuration] = useState<number>(0);

   // Load existing session by sessionId
   const loadExistingSession = useCallback(async (sessionId: string) => {
     try {
       setIsSessionLoading(true);
       const existingSession = await getSession(sessionId);
       
       if (existingSession && existingSession.problemId === problem?.id) {
         // Load existing session data
         setSessionId(existingSession.sessionId);
         setCode(existingSession.currentCode);
         setTestResults(existingSession.testResults);
         
         // Load messages with fallback
         const sessionMessages = existingSession.messages || [];
         if (sessionMessages.length === 0) {
           // If no messages found, add a welcome message for view mode
           const viewModeWelcomeMessage = {
             id: 'view-mode-welcome',
             role: 'assistant' as const,
             content: `Welcome to your completed interview session for **${problem?.title}**! 🎉\n\nThis is a view-only mode where you can:\n\n• Review your completed solution\n• Ask follow-up questions about the problem\n• Get explanations of concepts and approaches\n• Discuss time/space complexity\n• Explore alternative solutions\n• Learn from your interview experience\n\n💬 Feel free to ask any questions about the problem, your solution, or coding concepts in general!`,
             timestamp: new Date().toISOString(),
           };
           setMessages([viewModeWelcomeMessage]);
         } else {
           // Check if the first message is the original interview welcome message and replace it
           const firstMessage = sessionMessages[0];
           const isOriginalWelcomeMessage = firstMessage?.content?.includes('Welcome to your voice-enabled coding interview') ||
                                           firstMessage?.content?.includes('Take your time and work through the problem step by step');
           
           if (isOriginalWelcomeMessage) {
             // Replace the first message with view mode welcome
             const viewModeWelcomeMessage = {
               id: 'view-mode-welcome',
               role: 'assistant' as const,
               content: `Welcome to your completed interview session for **${problem?.title}**! 🎉\n\nThis is a view-only mode where you can:\n\n• Review your completed solution\n• Ask follow-up questions about the problem\n• Get explanations of concepts and approaches\n• Discuss time/space complexity\n• Explore alternative solutions\n• Learn from your interview experience\n\n💬 Feel free to ask any questions about the problem, your solution, or coding concepts in general!`,
               timestamp: new Date().toISOString(),
             };
             
             // Replace first message and keep the rest
             const updatedMessages = [viewModeWelcomeMessage, ...sessionMessages.slice(1)];
             setMessages(updatedMessages);
           } else {
             setMessages(sessionMessages);
           }
         }
         
         setElapsedTime(existingSession.elapsedTime);
         setIsSessionActive(false); // Set to false for view-only mode
         setSessionStartTime(new Date(Date.now() - existingSession.elapsedTime * 1000));
         console.log('Existing session loaded for viewing:', existingSession.sessionId, 'isSessionActive set to false');
         console.log('Loaded messages:', sessionMessages.length, 'messages');
         console.log('Messages content:', sessionMessages);
         return true;
       } else {
         console.error('Session not found or problem mismatch');
         return false;
       }
     } catch (error) {
       console.error('Error loading existing session:', error);
       return false;
     } finally {
       setIsSessionLoading(false);
     }
   }, [problem]);

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
       
       // Check if we're viewing an existing session
       const urlParams = new URLSearchParams(window.location.search);
       const sessionId = urlParams.get('sessionId');
       
       if (sessionId) {
         // Load existing session for viewing
         loadExistingSession(sessionId).then((success) => {
           if (!success) {
             // Fallback to new session if loading fails
             const starterCode = getFullPythonCode(problemId);
             setCode(starterCode);
             setElapsedTime(0);
             
             // Initialize chat with welcome message
             const welcomeMessage = {
               id: 'welcome',
               role: 'assistant' as const,
               content: `Welcome to your voice-enabled coding interview! I'm here to help guide you through solving **${foundProblem.title}**.\n\n🎤 This interview uses voice interaction to evaluate your communication skills.\n\n• Think out loud about your approach\n• Ask questions about the problem\n• Request hints if you get stuck\n• Discuss time/space complexity\n\n💬 You can also type your responses if needed.\n\nTake your time and work through the problem step by step. Start by explaining your initial thoughts about the problem!`,
               timestamp: new Date().toISOString(),
             };
             setMessages([welcomeMessage]);
           } else {
             // Successfully loaded existing session - don't override messages
             console.log('Successfully loaded existing session, keeping original messages');
           }
           setLoading(false);
         });
       } else {
         // Load Python starter code for this problem
         const starterCode = getFullPythonCode(problemId);
         setCode(starterCode);
 
         // Initialize interview session will be handled by initializeSession function
         
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
           content: `Welcome to your voice-enabled coding interview! I'm here to help guide you through solving **${foundProblem.title}**.\n\n🎤 This interview uses voice interaction to evaluate your communication skills.\n\n• Think out loud about your approach\n• Ask questions about the problem\n• Request hints if you get stuck\n• Discuss time/space complexity\n\n💬 You can also type your responses if needed.\n\nTake your time and work through the problem step by step. Start by explaining your initial thoughts about the problem!`,
           timestamp: new Date().toISOString(),
         };
         setMessages([welcomeMessage]);
         
         // Speak the welcome message after TTS is initialized (only if TTS is enabled)
         setTimeout(() => {
           if (speechSynthesis && ttsEnabled) {
             const cleanText = welcomeMessage.content
               .replace(/```[\s\S]*?```/g, '') // Remove code blocks
               .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
               .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
               .replace(/`([^`]+)`/g, '$1') // Remove inline code
               .replace(/\n/g, ' ') // Replace newlines with spaces
               .trim();
             
             if (cleanText) {
               console.log('Speaking welcome message:', cleanText);
               speakText(cleanText);
             }
           } else {
             console.log('TTS not ready or disabled, skipping welcome message');
           }
         }, 2000); // Longer delay to ensure TTS is fully initialized
         
         setLoading(false);
       }
     } else {
       setError(`Problem with ID ${problemId} not found`);
       setLoading(false);
     }
   }, [resolvedParams.problemId, loadExistingSession]);



   // Initialize TTS and STT when component mounts
   useEffect(() => {
     if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
       const synthesis = window.speechSynthesis;
       setSpeechSynthesis(synthesis);
       
       // Get available voices
       const loadVoices = () => {
         const voices = synthesis.getVoices();
         const preferredVoice = voices.find(voice => 
           voice.lang.startsWith('en') && voice.name.includes('Male')
         ) || voices.find(voice => 
           voice.lang.startsWith('en')
         ) || voices[0];
         
         if (preferredVoice) {
           console.log('Using TTS voice:', preferredVoice.name, preferredVoice.lang);
         }
       };
       
       // Load voices when they become available
       if (synthesis.getVoices().length > 0) {
         loadVoices();
       } else {
         synthesis.onvoiceschanged = loadVoices;
       }
     }

              // Initialize STT (Speech Recognition)
         if (typeof window !== 'undefined') {
           const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
           
           if (SpeechRecognition) {
             const recognition = new SpeechRecognition();
             recognition.continuous = true; // Keep recording continuously until manually stopped
             recognition.interimResults = true;
             recognition.lang = 'en-US';
             recognition.maxAlternatives = 1;
             
             // Event handlers
             recognition.onstart = () => {
               setIsListening(true);
               setRecognitionError(null);
               console.log('Speech recognition started - will continue until manually stopped');
             };
             
             recognition.onresult = (event) => {
               const transcript = Array.from(event.results)
                 .map(result => result[0].transcript)
                 .join('');
               setTranscript(transcript);
             };
             
             recognition.onend = () => {
               console.log('Speech recognition ended');
               // Always update the listening state when recognition ends
               setIsListening(false);
               console.log('Speech recognition ended - listening state updated');
             };
             
             recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
               console.error('Speech recognition error:', event);
               
               // Handle specific error types
               let errorMessage = `Microphone error: ${event.error}`;
               if (event.error === 'not-allowed') {
                 errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
               } else if (event.error === 'no-speech') {
                 errorMessage = 'No speech detected. Please try speaking again.';
               } else if (event.error === 'audio-capture') {
                 errorMessage = 'Microphone is in use by another application. Please close other apps using the microphone.';
               } else if (event.error === 'network') {
                 errorMessage = 'Network error. Please check your internet connection.';
               } else if (event.error === 'service-not-allowed') {
                 errorMessage = 'Speech recognition service not allowed. Please refresh the page and try again.';
               }
               
               setRecognitionError(errorMessage);
               setIsListening(false);
             };
             
             setRecognition(recognition);
             console.log('Speech recognition initialized with continuous mode');
           } else {
             console.log('Speech recognition not supported');
           }
         }
   }, []);

   // Cleanup TTS on unmount
   useEffect(() => {
     return () => {
       if (speechSynthesis) {
         speechSynthesis.cancel();
         console.log('TTS cleanup on component unmount');
       }
     };
   }, [speechSynthesis]);

   // Cleanup Speech Recognition on unmount
   useEffect(() => {
     return () => {
       if (recognition) {
         try {
           recognition.stop();
           recognition.abort();
           console.log('Speech recognition cleanup on component unmount');
         } catch (error) {
           console.error('Error cleaning up speech recognition:', error);
         }
       }
     };
   }, [recognition]);

   // Handle page visibility changes to stop TTS when user switches tabs
   useEffect(() => {
     const handleVisibilityChange = () => {
       if (document.hidden && speechSynthesis) {
         speechSynthesis.cancel();
         setIsAISpeaking(false);
         console.log('TTS stopped due to page visibility change');
       }
     };

     const handleBeforeUnload = () => {
       if (speechSynthesis) {
         speechSynthesis.cancel();
         setIsAISpeaking(false);
         console.log('TTS stopped due to page unload');
       }
     };

     document.addEventListener('visibilitychange', handleVisibilityChange);
     window.addEventListener('beforeunload', handleBeforeUnload);
     
     return () => {
       document.removeEventListener('visibilitychange', handleVisibilityChange);
       window.removeEventListener('beforeunload', handleBeforeUnload);
     };
   }, [speechSynthesis]);

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
   const initializeSession = useCallback(async () => {
     if (!problem) return;
     
     // Check if we're in view mode (sessionId in URL)
     const urlParams = new URLSearchParams(window.location.search);
     const viewSessionId = urlParams.get('sessionId');
     
     // Don't initialize if we're viewing an existing session
     if (viewSessionId) {
       console.log('Skipping session initialization - in view mode');
       return;
     }
     
     try {
       setIsSessionLoading(true);
       
       // Check if there's an existing session in localStorage
       const existingSessionId = getSessionFromStorage();
       
       if (existingSessionId) {
         // Try to restore existing session
         const existingSession = await getSession(existingSessionId);
         
         if (existingSession && existingSession.problemId === problem.id) {
           // Restore session
           setSessionId(existingSession.sessionId);
           setCode(existingSession.currentCode);
           setTestResults(existingSession.testResults);
           setMessages(existingSession.messages);
           setElapsedTime(existingSession.elapsedTime);
           setIsSessionActive(true);
           setSessionStartTime(new Date(Date.now() - existingSession.elapsedTime * 1000));
           console.log('Session restored:', existingSession.sessionId);
           return;
         } else {
           // Clear invalid session
           clearSessionFromStorage();
         }
       }
       
       // Create new session
       const newSessionId = await createSession({
         problemId: problem.id,
         problemTitle: problem.title,
         problemDifficulty: problem.difficulty,
         currentCode: code,
         testResults: [],
         messages: [],
         elapsedTime: 0,
         status: 'active'
       });
       
       setSessionId(newSessionId);
       saveSessionToStorage(newSessionId);
       setIsSessionActive(true);
       setSessionStartTime(new Date());
       console.log('New session created:', newSessionId);
       
     } catch (error) {
       console.error('Error initializing session:', error);
       // Fallback to local session without persistence
       setIsSessionActive(true);
       setSessionStartTime(new Date());
     } finally {
       setIsSessionLoading(false);
     }
   }, [problem, code]);

   // Auto-save session data
   const autoSaveSession = useCallback(async () => {
     if (!sessionId || !isSessionActive || !problem) return;
     
     try {
       const performanceMetrics = calculatePerformanceMetrics(
         testResults,
         elapsedTime,
         problem.difficulty
       );
       
       await updateSession(sessionId, {
         currentCode: code,
         testResults,
         messages,
         elapsedTime,
         performanceMetrics
       });
       
       setLastSavedAt(new Date());
       console.log('Session auto-saved');
     } catch (error) {
       console.error('Error auto-saving session:', error);
     }
   }, [sessionId, isSessionActive, problem, code, testResults, messages, elapsedTime]);

   // Debounced auto-save
   const debouncedAutoSave = useCallback(
     debounce(autoSaveSession, 30000), // Save every 30 seconds
     [autoSaveSession]
   );

   // Manual save function
   const handleManualSave = useCallback(async () => {
     if (isSessionActive && sessionId) {
       try {
         await autoSaveSession();
         // Show a brief save indicator
         const saveIndicator = document.createElement('div');
         saveIndicator.textContent = '💾 Saved!';
         saveIndicator.style.cssText = `
           position: fixed;
           top: 20px;
           right: 20px;
           background: #10b981;
           color: white;
           padding: 8px 16px;
           border-radius: 6px;
           font-size: 14px;
           font-weight: 500;
           z-index: 1000;
           box-shadow: 0 4px 12px rgba(0,0,0,0.15);
           animation: slideIn 0.3s ease-out;
         `;
         document.body.appendChild(saveIndicator);
         
         // Remove after 2 seconds
         setTimeout(() => {
           if (saveIndicator.parentNode) {
             saveIndicator.parentNode.removeChild(saveIndicator);
           }
         }, 2000);
       } catch (error) {
         console.error('Manual save failed:', error);
         // Show error indicator
         const errorIndicator = document.createElement('div');
         errorIndicator.textContent = '❌ Save failed';
         errorIndicator.style.cssText = `
           position: fixed;
           top: 20px;
           right: 20px;
           background: #ef4444;
           color: white;
           padding: 8px 16px;
           border-radius: 6px;
           font-size: 14px;
           font-weight: 500;
           z-index: 1000;
           box-shadow: 0 4px 12px rgba(0,0,0,0.15);
           animation: slideIn 0.3s ease-out;
         `;
         document.body.appendChild(errorIndicator);
         
         setTimeout(() => {
           if (errorIndicator.parentNode) {
             errorIndicator.parentNode.removeChild(errorIndicator);
           }
         }, 2000);
       }
     }
   }, [isSessionActive, sessionId, autoSaveSession]);

   // Keyboard event handler for Ctrl+S
   useEffect(() => {
     const handleKeyDown = (event: KeyboardEvent) => {
       if ((event.ctrlKey || event.metaKey) && event.key === 's') {
         event.preventDefault(); // Prevent browser's default save dialog
         handleManualSave();
       }
     };

     document.addEventListener('keydown', handleKeyDown);
     return () => document.removeEventListener('keydown', handleKeyDown);
   }, [handleManualSave]);

   const handleEndInterview = async (reason: 'manual' | 'completion') => {
     if (!isSessionActive || !problem) return;
     
     setIsSessionActive(false);
     const endTime = new Date();
     
     try {
       // Update session with final data
       if (sessionId) {
         const performanceMetrics = calculatePerformanceMetrics(
           testResults,
           elapsedTime,
           problem.difficulty
         );
         
         await updateSession(sessionId, {
           status: (reason === 'completion' || submitState === 'success') ? 'completed' : 'incomplete',
           endTime,
           duration: Math.ceil((endTime.getTime() - (sessionStartTime?.getTime() || 0)) / (1000 * 60)),
           submittedAt: submitState === 'success' ? new Date() : undefined,
           aiEvaluation: (reason === 'completion' || submitState === 'success') ? 'AI evaluation completed' : undefined,
           performanceMetrics
         });
         
         // Clear session from storage
         clearSessionFromStorage();
       }
       
       // Show appropriate message based on reason
       let endMessage = '';
       if (reason === 'completion' || submitState === 'success') {
         endMessage = '🎉 Interview completed successfully!';
       } else {
         endMessage = '👋 Interview session ended.';
       }
       
       // Add end message to chat
       const endMessageObj = {
         id: Date.now().toString(),
         role: 'assistant' as const,
         content: `${endMessage}\n\nSession Summary:\n• Duration: ${Math.ceil((endTime.getTime() - (sessionStartTime?.getTime() || 0)) / (1000 * 1000))} minutes\n• Status: ${(reason === 'completion' || submitState === 'success') ? 'completed' : 'incomplete'}\n• Test Cases: ${testResults.filter(r => r.pass).length}/${testResults.length} passed\n• Messages: ${messages.length} exchanged`,
         timestamp: new Date().toISOString(),
       };
       setMessages(prev => [...prev, endMessageObj]);
       
       // Redirect to dashboard after interview ends
       setTimeout(() => {
         window.location.href = '/dashboard';
       }, 1000); // 1 second delay to show the end message
       
     } catch (error) {
       console.error('Error ending session:', error);
     }
   };
 
   // Session management effects
   useEffect(() => {
     if (problem && !isSessionActive) {
       // Check if we're in view mode (sessionId in URL)
       const urlParams = new URLSearchParams(window.location.search);
       const sessionId = urlParams.get('sessionId');
       
       // Only initialize new session if not viewing an existing session
       if (!sessionId) {
         initializeSession();
       }
     }
   }, [problem, isSessionActive, initializeSession]);

   // Auto-save session periodically
   useEffect(() => {
     if (isSessionActive && sessionId) {
       const interval = setInterval(() => {
         debouncedAutoSave();
       }, 30000); // Every 30 seconds
       
       return () => clearInterval(interval);
     }
   }, [isSessionActive, sessionId, debouncedAutoSave]);

   // Auto-save on code changes (debounced)
   useEffect(() => {
     if (isSessionActive && sessionId) {
       const timeoutId = setTimeout(() => {
         debouncedAutoSave();
       }, 2000); // Wait 2 seconds after code changes
       
       return () => clearTimeout(timeoutId);
     }
   }, [code, isSessionActive, sessionId, debouncedAutoSave]);

   // Auto-save on test results changes (debounced)
   useEffect(() => {
     if (isSessionActive && sessionId) {
       const timeoutId = setTimeout(() => {
         debouncedAutoSave();
       }, 1000); // Wait 1 second after test results change
       
       return () => clearTimeout(timeoutId);
     }
   }, [testResults, isSessionActive, sessionId, debouncedAutoSave]);

   // Auto-save on messages changes (debounced)
   useEffect(() => {
     if (isSessionActive && sessionId) {
       const timeoutId = setTimeout(() => {
         debouncedAutoSave();
       }, 1000); // Wait 1 second after messages change
       
       return () => clearTimeout(timeoutId);
     }
   }, [messages, isSessionActive, sessionId, debouncedAutoSave]);

   // Timer effect
   useEffect(() => {
     if (!isSessionActive) return;
   
     const timer = setInterval(() => {
       setElapsedTime(prev => prev + 1);
     }, 1000);
   
     return () => clearInterval(timer);
   }, [isSessionActive]);

   // Recording duration timer
   useEffect(() => {
     if (!isListening || !recordingStartTime) return;
     
     const timer = setInterval(() => {
       const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
       setRecordingDuration(duration);
     }, 1000);
     
     return () => clearInterval(timer);
   }, [isListening, recordingStartTime]);

     // Microphone permission handlers
   const handleMicrophonePermissionGranted = () => {
     setHasMicrophonePermission(true);
     setShowMicrophonePrompt(false);
   };

   const handleMicrophonePermissionDenied = () => {
     setHasMicrophonePermission(false);
     setShowMicrophonePrompt(false);
   };

   // STT Functions
   const startVoiceInteraction = () => {
     if (!recognition) {
       console.log('Speech recognition not available');
       return;
     }
     
     // Stop any ongoing AI speech when starting voice chat
     if (isAISpeaking || speechSynthesis?.speaking) {
       stopSpeaking();
       console.log('Stopped AI speech to start voice chat');
     }
     
     // Reset error state and start recording timer
     setRecognitionError(null);
     setRecordingStartTime(Date.now());
     setRecordingDuration(0);
     setTranscript('');
     
     try {
       // Add a small delay to ensure TTS has fully stopped
       setTimeout(() => {
         try {
           recognition.start();
           console.log('Started voice recognition - will continue until manually stopped');
         } catch (innerError) {
           console.error('Error starting speech recognition after delay:', innerError);
           setRecognitionError('Failed to start microphone - please try again');
           setRecordingStartTime(null);
         }
       }, 500); // Increased delay to ensure TTS cleanup
     } catch (error) {
       console.error('Error starting speech recognition:', error);
       setRecognitionError('Failed to start microphone');
       setRecordingStartTime(null);
     }
   };

   const stopVoiceInteraction = () => {
     if (recognition) {
       try {
         recognition.stop();
         // Small delay to ensure recognition stops properly
         setTimeout(() => {
           setIsListening(false);
           console.log('Stopped voice recognition manually');
         }, 100);
         // Keep the transcript visible for review
         // Don't reset transcript here - let user review and send
       } catch (error) {
         console.error('Error stopping voice recognition:', error);
         setIsListening(false);
       }
     }
   };



   const sendVoiceMessage = () => {
     if (transcript.trim()) {
       console.log('Sending voice message:', transcript);
       sendMessage(transcript);
       setTranscript('');
       setIsListening(false);
       setRecordingStartTime(null);
       setRecordingDuration(0);
     }
   };

   const clearTranscript = () => {
     setTranscript('');
     setIsListening(false);
     setRecordingStartTime(null);
     setRecordingDuration(0);
   };

   // TTS Functions
   const speakText = (text: string) => {
     if (!speechSynthesis || !ttsEnabled) {
       console.log('TTS not available or disabled');
       return;
     }

     // Stop any current speech
     speechSynthesis.cancel();

     // Create new utterance
     const utterance = new SpeechSynthesisUtterance(text);
     setSpeechUtterance(utterance);

     // Configure voice settings
     const voices = speechSynthesis.getVoices();
     const preferredVoice = voices.find(voice => 
       voice.lang.startsWith('en') && voice.name.includes('Male')
     ) || voices.find(voice => 
       voice.lang.startsWith('en')
     ) || voices[0];

     if (preferredVoice) {
       utterance.voice = preferredVoice;
     }

     utterance.rate = 1.1; // Slightly faster than normal
     utterance.pitch = 1.0; // Normal pitch
     utterance.volume = 1.0; // Full volume

     // Event handlers
     utterance.onstart = () => {
       setIsAISpeaking(true);
       console.log('AI started speaking');
     };

     utterance.onend = () => {
       setIsAISpeaking(false);
       console.log('AI finished speaking');
     };

     utterance.onerror = (event) => {
       setIsAISpeaking(false);
       console.error('TTS error:', event.error);
     };

     // Start speaking
     speechSynthesis.speak(utterance);
   };

   const stopSpeaking = () => {
     if (speechSynthesis) {
       speechSynthesis.cancel();
       setIsAISpeaking(false);
     }
   };

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
          isViewMode: !isSessionActive, // Pass view mode flag
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

      // Speak the AI response (only if TTS is enabled)
      if (data.message.role === 'assistant' && ttsEnabled) {
        // Clean the text for speech (remove markdown, code blocks, etc.)
        const cleanText = data.message.content
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
          .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
          .replace(/`([^`]+)`/g, '$1') // Remove inline code
          .replace(/\n/g, ' ') // Replace newlines with spaces
          .trim();
        
        if (cleanText) {
          speakText(cleanText);
        }
      }

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
    if (!isSessionActive) {
      // View mode - different prompts for completed sessions
      switch (actionType) {
        case 'hint':
          await sendMessage('Can you explain the key concepts and approach used in this solution?');
          break;
        case 'clarify':
          await sendMessage('Can you help me understand how this solution works step by step?');
          break;
        case 'complexity':
          await sendMessage('What is the time and space complexity of this solution, and how does it compare to other approaches?');
          break;
        case 'explain':
          await sendMessage('Can you explain the solution approach and how it works?');
          break;
        case 'improve':
          await sendMessage('What improvements could be made to this solution and what are some alternative approaches?');
          break;
      }
    } else {
      // Active interview mode - original prompts
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
        case 'explain':
          await sendMessage('Can you explain the solution approach and how it works?');
          break;
        case 'improve':
          await sendMessage('What improvements could be made to this solution?');
          break;
      }
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
        
        // Speak the AI hint response (only if TTS is enabled)
        if (data.message.role === 'assistant' && ttsEnabled) {
          const cleanText = data.message.content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\n/g, ' ')
            .trim();
          
          if (cleanText) {
            speakText(cleanText);
          }
        }
        
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
      content: `I'm working on ${problem.title} (${problem.difficulty} difficulty) and I'd like a hint. Here's my current code:\n\n\`\`\`python\n${code}\n\`\`\`\n\nIMPORTANT: I do NOT want a solution or working code. I only want:\n• Conceptual guidance about what to think about\n• General approaches to consider (without specifics)\n• Questions to help me think through the problem\n• Common pitfalls to be aware of\n• What data structures or concepts might be relevant\n\nPlease give me a brief hint (2-3 sentences max) and then ask me a question to help me think further. Do NOT show me how to implement anything or provide any working code.`,
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

  // Show microphone permission prompt if not granted
  if (showMicrophonePrompt) {
    return (
      <MicrophonePermission
        onPermissionGranted={handleMicrophonePermissionGranted}
        onPermissionDenied={handleMicrophonePermissionDenied}
      />
    );
  }

  // Don't show interview if microphone permission denied
  if (!hasMicrophonePermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-6xl mb-4">🎤</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Microphone Access Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This interview requires voice interaction to properly evaluate your communication skills. 
            Without microphone access, we cannot assess how well you articulate your problem-solving approach.
          </p>
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

    // Debug panel for microphone status
    const renderMicrophoneDebug = () => (
      <div style={{ position: 'fixed', bottom: 0, left: 0, background: '#222', color: '#fff', padding: 12, zIndex: 9999, fontSize: 12, borderRadius: 8, opacity: 0.9 }}>
        <div><b>🎤 Microphone Debug</b></div>
        <div>Status: {isListening ? '🟢 Recording' : '🔴 Ready'}</div>
        <div>Duration: {recordingDuration}s</div>
        <div>Error: {recognitionError || 'None'}</div>
        <div>Recognition: {recognition ? '✅ Available' : '❌ Not available'}</div>
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
               
               {/* Session Status */}
               {isSessionActive && (
                 <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                   <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                   <span className="text-sm font-medium text-green-800 dark:text-green-200">
                     Session Active
                   </span>
                   {lastSavedAt && (
                     <span className="text-xs text-green-600 dark:text-green-400">
                       • Saved {Math.floor((Date.now() - lastSavedAt.getTime()) / 1000)}s ago
                     </span>
                   )}
                 </div>
               )}
               
               {/* Session Loading */}
               {isSessionLoading && (
                 <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800">
                   <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                   <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                     Loading Session...
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
               
               {!isSessionActive && (
                 <Link
                   href="/dashboard"
                   className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                 >
                   🚪 Leave Session
                 </Link>
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



                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div className="h-full flex flex-col">
                                         {/* Chat Header */}
                     <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                       <div className="flex items-center justify-between">
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                           {isSessionActive ? 'Interview Chat Transcript' : 'Session Chat History'}
                         </h3>
                         <div className="flex items-center gap-2">
                           {submitState === 'success' && (
                             <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                               ✅ Solution Submitted
                             </div>
                           )}
                           <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <span>Voice Enabled</span>
                           </div>
                           {isAISpeaking && (
                             <div className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                               <span>AI Speaking</span>
                             </div>
                           )}
                           {!isAISpeaking && ttsEnabled && (
                             <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                               <span>TTS Ready</span>
                             </div>
                           )}
                           {!ttsEnabled && (
                             <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                               <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                               <span>TTS Disabled</span>
                             </div>
                           )}
                           {isListening && (
                             <div className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400">
                               <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                               <span>Voice Active</span>
                             </div>
                           )}
                         </div>
                       </div>
                       
                       {/* TTS Test Controls */}
                       <div className="mt-3 flex items-center gap-2">
                         <button
                           onClick={() => {
                             if (!ttsEnabled) {
                               alert('TTS is currently disabled. Please enable TTS first.');
                               return;
                             }
                             const testText = "Hello! This is a test of the text-to-speech system. Can you hear me speaking?";
                             speakText(testText);
                           }}
                           disabled={!ttsEnabled}
                           className={`px-3 py-1 rounded text-sm transition-colors ${
                             ttsEnabled 
                               ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                               : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                           }`}
                         >
                           🔊 Test TTS
                         </button>
                         
                         <button
                           onClick={() => {
                             if (!ttsEnabled) {
                               alert('TTS is currently disabled. Please enable TTS first.');
                               return;
                             }
                             const welcomeText = "Welcome to your voice-enabled coding interview! I'm here to help guide you through solving this problem. This interview uses voice interaction to evaluate your communication skills. Think out loud about your approach, ask questions about the problem, request hints if you get stuck, and discuss time and space complexity. You can also type your responses if needed. Take your time and work through the problem step by step. Start by explaining your initial thoughts about the problem!";
                             speakText(welcomeText);
                           }}
                           disabled={!ttsEnabled}
                           className={`px-3 py-1 rounded text-sm transition-colors ${
                             ttsEnabled 
                               ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                               : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                           }`}
                         >
                           🎤 Speak Welcome
                         </button>
                         
                         {/* TTS Help Text */}
                         <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                           <span className="font-medium">TTS:</span> Controls whether AI responses are spoken aloud. When disabled, you&apos;ll only see text responses.
                         </div>

                       </div>
                       
                       {/* Microphone Status and Error Display */}
                       {recognitionError && (
                         <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <span className="text-red-500">⚠️</span>
                               <span className="text-red-700 dark:text-red-300 text-sm font-medium">
                                 {recognitionError}
                               </span>
                             </div>
                             <button
                               onClick={() => setRecognitionError(null)}
                               className="text-red-600 hover:text-red-800 text-sm"
                             >
                               ✕
                             </button>
                           </div>

                         </div>
                       )}
                       
                       {/* Microphone Status Info */}
                       <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                         <div className="flex items-center gap-1">
                           <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                           <span>Microphone: {isListening ? 'Recording' : 'Ready'}</span>
                           {isListening && recordingDuration > 0 && (
                             <span className="text-green-600 dark:text-green-400">
                               ({recordingDuration}s)
                             </span>
                           )}
                         </div>
                         <div className="flex items-center gap-1">
                           <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                           <span>Voice Chat: Manual Control</span>
                         </div>
                       </div>
                       
                       {/* Transcript Summary */}
                       <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                         <span className="font-medium">{messages.length}</span> messages • 
                         <span className="font-medium ml-1">
                           {messages.filter(m => m.role === 'user').length}
                         </span> from you • 
                         <span className="font-medium ml-1">
                           {messages.filter(m => m.role === 'assistant').length}
                         </span> from AI
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
                              <span className="text-white text-lg">🤖</span>
                            </div>
                          )}
                          
                          <div className={`rounded-lg p-4 max-w-[85%] ${
                            message.role === 'user' 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200'
                          }`}>
                            {/* Message header with role indicator */}
                            <div className={`flex items-center gap-2 mb-3 text-xs ${
                              message.role === 'user' ? 'text-gray-500 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              <span className="font-medium">
                                {message.role === 'user' ? '👤 You' : '🤖 AI Interviewer'}
                              </span>
                              <span className="opacity-70">• {new Date(message.timestamp).toLocaleTimeString()}</span>
                            </div>
                            
                            <ChatMessageRenderer 
                              content={message.content} 
                              role={message.role}
                              onCodeInsert={(code) => setCode(code)}
                            />
                          </div>

                          {message.role === 'user' && (
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-lg">👤</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Loading indicator */}
                      {isLoading && (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-lg">🤖</span>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-[85%]">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <span className="text-blue-700 dark:text-blue-300 text-sm ml-2">AI is thinking...</span>
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-70">
                              Preparing response...
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
                      {/* Voice Interaction Controls */}
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <button
                          onClick={isListening ? stopVoiceInteraction : startVoiceInteraction}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                            isListening 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          {isListening ? 'Stop Recording' : 'Start Recording'}
                        </button>
                        
                        <button
                          onClick={stopSpeaking}
                          disabled={!isAISpeaking}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                            isAISpeaking 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Stop AI
                        </button>
                        
                        <button
                          onClick={() => {
                            setTtsEnabled(!ttsEnabled);
                            // Provide immediate feedback
                            if (!ttsEnabled) {
                              // If enabling TTS, give a quick test sound
                              setTimeout(() => {
                                if (speechSynthesis) {
                                  const testUtterance = new SpeechSynthesisUtterance("TTS enabled");
                                  testUtterance.rate = 1.5;
                                  testUtterance.volume = 0.5;
                                  speechSynthesis.speak(testUtterance);
                                }
                              }, 100);
                            }
                          }}
                          className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                            ttsEnabled 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                          title={ttsEnabled ? 'Click to disable text-to-speech' : 'Click to enable text-to-speech'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                          {ttsEnabled ? '🔊 TTS On' : '🔇 TTS Off'}
                        </button>
                        
                        {/* Manual Microphone Restart Button */}
                        <button
                          onClick={() => {
                            if (recognition) {
                              try {
                                recognition.stop();
                                setIsListening(false);
                                setTimeout(() => {
                                  try {
                                    recognition.start();
                                    setIsListening(true);
                                    setRecognitionError(null);
                                  } catch (error) {
                                    console.error('Failed to restart microphone:', error);
                                    setRecognitionError('Failed to restart microphone');
                                    setIsListening(false);
                                  }
                                }, 500);
                              } catch (error) {
                                console.error('Failed to stop microphone:', error);
                                setIsListening(false);
                              }
                            }
                          }}
                          disabled={!recognition}
                          className="flex items-center gap-2 px-4 py-3 rounded-lg transition-colors bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                          title="Manually restart microphone if it stops working"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Restart Mic
                        </button>
                      </div>

                      {/* Voice Transcript Display */}
                      {isListening && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {transcript ? 'Recording - Review Your Message' : 'Recording...'}
                              </span>
                              {recordingDuration > 0 && (
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  ({recordingDuration}s)
                                </span>
                              )}
                            </div>
                            <button
                              onClick={clearTranscript}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              ✕ Clear
                            </button>
                          </div>
                          
                          <div className="text-sm text-blue-800 dark:text-blue-200 mb-3 p-2 bg-white dark:bg-blue-800/50 rounded border min-h-[3rem] flex items-center">
                            {transcript || 'Start speaking... (your message will appear here)'}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={sendVoiceMessage}
                              disabled={!transcript.trim()}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm transition-colors font-medium"
                            >
                              📤 Send Message
                            </button>
                          </div>
                          
                          {transcript && (
                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                              💡 Tip: Review your message above, then click &quot;Send Message&quot;
                            </div>
                          )}
                        </div>
                      )}
                      
                      <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }} className="flex gap-3 mb-3">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={isSessionActive ? "Type your thoughts, questions, or request a hint..." : "Ask follow-up questions about this interview session..."}
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
                        {isSessionActive ? (
                          <>
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
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleQuickAction('explain')}
                              disabled={isLoading}
                              className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              📝 Explain Solution
                            </button>
                            <button 
                              onClick={() => handleQuickAction('improve')}
                              disabled={isLoading}
                              className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              🚀 Suggest Improvements
                            </button>
                          </>
                        )}
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
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Python Code Editor {!isSessionActive && '(View Mode)'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Python 3.x</span>
                    </div>
                    {isSessionActive && (
                      <button
                        onClick={() => setCode(getFullPythonCode(parseInt(resolvedParams.problemId)))}
                        className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors"
                      >
                        Reset Code
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  value={code}
                  onChange={isSessionActive ? (value) => setCode(value || '') : undefined}
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
                    readOnly: !isSessionActive,
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
                    contextmenu: isSessionActive,
                    selectOnLineNumbers: true,
                    cursorStyle: isSessionActive ? 'line' : 'block',
                    cursorWidth: 2,
                    renderWhitespace: 'selection',
                    showFoldingControls: 'always',
                    smoothScrolling: true,
                    cursorBlinking: 'blink',
                    multiCursorModifier: 'ctrlCmd',
                    formatOnPaste: isSessionActive,
                    formatOnType: isSessionActive,
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
                {/* Debug: Show current state */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mb-2">
                    Debug: isSessionActive = {String(isSessionActive)}
                  </div>
                )}
                {isSessionActive ? (
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
                      disabled={!isEditorReady || submitState === 'submitting'}
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
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      📖 View Mode - This is a completed interview session
                    </div>
                    <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                      You can view the code and chat history, and ask follow-up questions
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
                             {renderJudge0Debug()}
                             {renderMicrophoneDebug()}
 
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