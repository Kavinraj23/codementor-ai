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

// Helper function to determine optimal token limits based on request type
function getTokenLimitForRequest(isHintRequest: boolean, isSolutionSubmission: boolean): number {
  if (isHintRequest) {
    return 200; // Hints should be brief and focused
  } else if (isSolutionSubmission) {
    return 600; // Evaluations need more space for detailed feedback
  } else {
    return 300; // General chat - balanced approach
  }
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

    // Add general system instructions for the AI interviewer
    contextMessage += `SYSTEM INSTRUCTIONS: You are an AI coding interview coach. Your role is to GUIDE candidates through problems, not solve them for them.

CRITICAL RULES:
1. NEVER provide complete working solutions or implementations
2. NEVER write code that solves the problem
3. NEVER reveal optimal algorithms or approaches
4. NEVER provide step-by-step solutions
5. Your goal is to help candidates THINK through problems, not give them answers

Instead, you should:
- Ask probing questions to guide their thinking
- Provide conceptual hints and general approaches
- Encourage them to work through problems themselves
- Help them debug their own code when they're stuck
- Test their understanding with follow-up questions

Remember: The learning happens when candidates solve problems themselves. You are a coach, not a solution provider.

---

`;

    // Add problem context only when needed
    if (includeProblemContext && problemContext) {
      // Truncate long descriptions to save tokens
      const truncatedDescription = problemContext.description.length > 200 
        ? problemContext.description.slice(0, 200) + '...'
        : problemContext.description;
      
      // Limit examples to first 2-3 to save tokens
      const limitedExamples = problemContext.examples.length > 3 
        ? problemContext.examples.slice(0, 3).map(e => `${e.input} → ${e.output}`).join(', ') + `... (${problemContext.examples.length - 3} more)`
        : problemContext.examples.map(e => `${e.input} → ${e.output}`).join(', ');
      
      contextMessage += `CURRENT PROBLEM: ${problemContext.title} (${problemContext.difficulty})

${truncatedDescription}

Examples: ${limitedExamples}

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
   - Communication (0-10 points): Code comments, variable naming, function documentation, explanation clarity, ability to articulate approach verbally

2. After your evaluation, ask 1-3 follow-up questions that start with "Follow-up Question X:" to test deeper understanding

3. End with a brief summary

4. Provide a FINAL PERFORMANCE NOTE (1-2 sentences) that summarizes the candidate's overall performance. This should be encouraging but honest, highlighting their strengths and one key area for growth.

Format your scoring as: "SCORE: Code Quality: X/30, Algorithm Efficiency: Y/25, Problem Understanding: Z/20, Implementation: W/15, Communication: V/10"

When evaluating Communication (0-10 points), consider:
- Code Comments (0-3 points): Are there helpful comments explaining complex logic?
- Variable/Function Naming (0-2 points): Are names descriptive and self-documenting?
- Function Documentation (0-2 points): Are functions properly documented with purpose and parameters?
- Explanation Clarity (0-2 points): Can the candidate clearly explain their approach?
- Code Readability (0-1 point): Is the code easy to follow and understand?

Format your final note as: "FINAL NOTE: [Your 1-2 sentence performance summary here]"

Keep your response focused, professional, and include specific examples from their code.

---

`;
     }

     // Special handling for hint requests - STRICT NO-SOLUTION POLICY
     if (isHintRequest) {
       contextMessage += `CRITICAL INSTRUCTIONS FOR HINT REQUESTS:

You are a coding interview coach. The candidate is asking for a HINT, not a solution. You MUST:

1. NEVER provide complete code solutions, implementations, or working algorithms
2. NEVER show the candidate how to solve the problem step-by-step
3. NEVER reveal the optimal approach or algorithm
4. NEVER provide code snippets that solve the problem

Instead, you MUST provide ONLY:
- Conceptual guidance about what to think about
- General approaches to consider (without specifics)
- Questions to help them think through the problem
- Common pitfalls to be aware of
- Data structures or concepts that might be relevant
- Encouragement to work through it themselves

Your response should be 2-3 sentences maximum and end with a question that prompts them to think further.

Example of GOOD hint: "Consider what data structure would be efficient for this type of operation. Think about the time complexity of your approach. What edge cases might you encounter?"

Example of BAD hint: "You can use a hash map to store the frequencies, then iterate through the array to find the answer."

Remember: Your goal is to guide thinking, not provide answers. If they ask for more specific help, redirect them to work on it themselves first.

---

`;
     }

     // Special handling for template requests - STRICT NO-SOLUTION POLICY
     if (messages.some(msg => msg.content.toLowerCase().includes('template') || 
                           msg.content.toLowerCase().includes('starter') || 
                           msg.content.toLowerCase().includes('boilerplate') ||
                           msg.content.toLowerCase().includes('show me') ||
                           msg.content.toLowerCase().includes('give me') ||
                           msg.content.toLowerCase().includes('can you write'))) {
       contextMessage += `CRITICAL INSTRUCTIONS FOR TEMPLATE/CODE REQUESTS:

The candidate is asking for code or templates. You are STRICTLY FORBIDDEN from:

1. Providing any working code that solves the problem
2. Showing complete function implementations
3. Writing algorithms or logic that addresses the problem
4. Providing code that could be copy-pasted to solve the problem

Instead, you MUST:
- Explain that you cannot provide code solutions during interviews
- Encourage them to start with basic Python syntax and work through the problem
- Suggest they begin with a simple function signature and empty implementation
- Remind them that the learning comes from working through the problem themselves
- Offer to help them think through their approach conceptually

Your response should be firm but encouraging, emphasizing that you're here to guide their thinking, not provide solutions.

Example response: "I understand you'd like some starter code, but I can't provide working solutions during interviews. This is part of the learning process! Start with a basic function signature and work through the logic step by step. What's your initial approach to this problem?"

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
      max_output_tokens: getTokenLimitForRequest(isHintRequest || false, isSolutionSubmission || false), // Dynamic token limit
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