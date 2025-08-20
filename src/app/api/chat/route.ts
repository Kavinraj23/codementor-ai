import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_INTERVIEWER_API_KEY,
});

// Types for better TypeScript support
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ProblemContext {
  title: string;
  difficulty: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
}

interface ChatRequest {
  messages: ChatMessage[];
  problemContext: ProblemContext | null;
  currentCode: string;
  isSolutionSubmission?: boolean;
  isHintRequest?: boolean;
}

// Helper function to manage context and control token usage
function manageContext(messages: ChatMessage[], currentCode: string, problemContext: ProblemContext | null) {
  // Keep only last 6 messages to control costs
  const recentMessages = messages.slice(-6);
  
  // Only include code if recent message asks about it
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const codeKeywords = ['code', 'debug', 'review', 'optimize', 'fix', 'approach', 'solution', 'implement'];
  const needsCode = codeKeywords.some(keyword => lastMessage.includes(keyword));
  
  // Include problem context only for first few messages or when specifically asked
  const problemKeywords = ['problem', 'question', 'description', 'examples', 'constraints'];
  const needsProblemContext = messages.length <= 3 || 
    problemKeywords.some(keyword => lastMessage.includes(keyword));
  
  return {
    messages: recentMessages,
    includeCode: needsCode,
    includeProblemContext: needsProblemContext
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables
    if (!process.env.OPENAI_INTERVIEWER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_CUSTOM_GPT_ID) {
      return NextResponse.json(
        { error: 'Custom GPT ID not configured' },
        { status: 500 }
      );
    }

    const { messages, problemContext, currentCode, isSolutionSubmission, isHintRequest }: ChatRequest = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Smart context management to control token usage
    const { messages: managedMessages, includeCode, includeProblemContext } = 
      manageContext(messages, currentCode, problemContext);

    // Build minimal context message for custom GPT
    let contextMessage = '';

    // Add problem context only when needed
    if (includeProblemContext && problemContext) {
      contextMessage += `CURRENT PROBLEM: ${problemContext.title} (${problemContext.difficulty})

${problemContext.description}

Examples: ${JSON.stringify(problemContext.examples)}

---

`;
    } else if (problemContext) {
      // Just reference the problem by name to save tokens
      contextMessage += `Working on: ${problemContext.title} (${problemContext.difficulty})

`;
    }

    // Add code context only when needed
    if (includeCode && currentCode && currentCode.trim()) {
      contextMessage += `CURRENT CODE:
\`\`\`python
${currentCode}
\`\`\`

---

`;
    }

         // Special handling for solution submissions - include follow-up questions and scoring
     if (isSolutionSubmission) {
       contextMessage += `INSTRUCTIONS: You are evaluating a completed coding interview solution. You MUST provide:

1. A comprehensive evaluation covering:
   - Code Quality (0-30 points): Readability, structure, naming conventions
   - Algorithm Efficiency (0-25 points): Time/space complexity, optimal approach
   - Problem Understanding (0-20 points): Correct interpretation, edge case handling
   - Implementation (0-15 points): Bug-free code, test case coverage
   - Communication (0-10 points): Code comments, explanation clarity

2. After your evaluation, ask 1-3 follow-up questions that start with "Follow-up Question X:" to test deeper understanding

3. End with a brief summary

4. Provide a FINAL PERFORMANCE NOTE (1-2 sentences) that summarizes the candidate's overall performance. This should be encouraging but honest, highlighting their strengths and one key area for growth.

Format your scoring as: "SCORE: Code Quality: X/30, Algorithm Efficiency: Y/25, Problem Understanding: Z/20, Implementation: W/15, Communication: V/10"

Format your final note as: "FINAL NOTE: [Your 1-2 sentence performance summary here]"

Keep your response focused, professional, and include specific examples from their code.

---

`;
     }

    // Prepare messages for Custom GPT (no system prompt needed!)
    const openAIMessages = [];
    
    // Add context as first user message if we have any context
    if (contextMessage) {
      openAIMessages.push({
        role: 'user' as const,
        content: contextMessage + managedMessages[0]?.content || '',
      });
      
      // Add remaining messages (skip first since we combined it with context)
      openAIMessages.push(...managedMessages.slice(1).map((msg: ChatMessage) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })));
    } else {
      // No context needed, just send messages as-is
      openAIMessages.push(...managedMessages.map((msg: ChatMessage) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })));
    }

    // Call OpenAI Custom GPT API (fallback to regular API if needed)
    const completion = await openai.responses.create({
      prompt: {
        id: process.env.OPENAI_CUSTOM_GPT_ID!, // Secure environment variable
        version: "1"
      },
      input: openAIMessages, // Send our conversation messages as input
      text: {
        format: {
          type: "text"
        }
      },
      reasoning: {},
      max_output_tokens: 400, // Control costs
      store: true
    });

    // Parse custom GPT response - correct structure based on your API response
    let assistantMessage = '';
    
    // The response structure shows the message is in output_text or output[0].content[0].text
    if (completion.output_text && typeof completion.output_text === 'string') {
      assistantMessage = completion.output_text;
    } else if (completion.output && completion.output[0] && completion.output[0].content && completion.output[0].content[0] && completion.output[0].content[0].text) {
      assistantMessage = completion.output[0].content[0].text;
    } else {
      // Fallback for unexpected structure
      console.log('Unexpected Custom GPT Response structure:', completion);
      assistantMessage = 'Sorry, I encountered an issue processing the response.';
    }

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Calculate estimated cost (Custom GPT pricing: varies by base model)
    const totalTokens = completion.usage?.total_tokens || 0;
    const promptTokens = completion.usage?.input_tokens || 0;
    const completionTokens = completion.usage?.output_tokens || 0;
    const estimatedCost = (totalTokens * 0.002 / 1000); // Adjust pricing based on your custom GPT's base model

    // Log usage for monitoring
    console.log(`[Chat API] Tokens: ${totalTokens} | Estimated cost: $${estimatedCost.toFixed(4)} | Messages: ${managedMessages.length} | Context: code=${includeCode}, problem=${includeProblemContext}`);

    return NextResponse.json({
      message: {
        id: Date.now().toString(),
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      },
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
      },
      metadata: {
        messages_processed: managedMessages.length,
        total_messages_sent: messages.length,
        included_code: includeCode,
        included_problem_context: includeProblemContext,
        estimated_cost: estimatedCost.toFixed(4),
      },
    });

  } catch (error: unknown) {
    console.error('OpenAI API Error:', error);

    // Handle specific OpenAI errors
    const openAIError = error as { error?: { type?: string } };
    if (openAIError?.error?.type === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your credits.' },
        { status: 429 }
      );
    }

    if (openAIError?.error?.type === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// Optional: Add rate limiting
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}