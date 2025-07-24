import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// interfaces are for type safety and ensures data consistency
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ScoringCriteria {
  correctness: number;    // 0-100
  efficiency: number;     // 0-100
  style: number;          // 0-100
  communication: number;  // 0-100
  overall: number;        // 0-100
}

export interface ScoringResult {
  scores: ScoringCriteria;
  feedback: string;
}

/**
 * Generate AI interviewer response with advanced conversation handling
 */
export async function generateInterviewerResponse(
  problemPrompt: string,
  chatHistory: ChatMessage[],
  userMessage: string
): Promise<string> {
  const systemPrompt = `You are a senior software engineer conducting a technical coding interview. You are experienced, patient, and skilled at guiding candidates through problems.

PROBLEM CONTEXT:
${problemPrompt}

YOUR INTERVIEWING STYLE:
- Professional yet approachable, like a mentor
- Ask clarifying questions to understand their thought process
- Provide hints when candidates are struggling, but don't give away solutions
- Redirect politely when candidates go off-topic
- Recognize signs of struggle and offer appropriate help
- Encourage good practices (edge cases, testing, optimization)
- Keep responses concise (2-3 sentences max unless explaining a concept)

HANDLING DIFFERENT SCENARIOS:

1. STRUGGLING CANDIDATES:
   - If they say "I don't know" or seem stuck, ask leading questions
   - Break down the problem into smaller steps
   - Suggest starting with brute force if they're overthinking
   - Offer examples or analogies to clarify concepts

2. OFF-TOPIC RESPONSES:
   - Politely redirect: "That's interesting, but let's focus on the coding problem..."
   - Acknowledge their point briefly, then steer back to the task

3. INVALID/UNCLEAR INPUT:
   - Ask for clarification: "Could you elaborate on what you mean by..."
   - Rephrase their question to confirm understanding

4. CONFIDENT CANDIDATES:
   - Challenge them with follow-up questions about edge cases
   - Ask about time/space complexity
   - Discuss alternative approaches

5. RANDOM TANGENTS:
   - "I appreciate that perspective. Now, regarding our coding problem..."
   - Keep them engaged but focused

CONVERSATION HISTORY:
${chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

CURRENT USER MESSAGE: "${userMessage}"

Respond as the interviewer would, keeping in mind:
- The candidate's current progress and understanding level
- Whether they seem stuck, confused, or off-track
- The natural flow of a technical interview
- Your goal is to evaluate their problem-solving skills while helping them succeed`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `Respond to this candidate message: "${userMessage}"` }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 
           "I need a moment to process that. Could you rephrase your question or tell me more about your current approach?";
  } catch (error) {
    console.error('OpenAI API error:', error);
    return "I'm having some technical difficulties. Could you repeat that, and let's continue with the problem?";
  }
}

/**
 * Score the candidate's solution with detailed analysis (scores out of 100)
 */
export async function scoreSolution(
  problemPrompt: string,
  finalCode: string,
  chatHistory: ChatMessage[]
): Promise<ScoringResult> {
  const scoringPrompt = `You are a senior software engineer evaluating a candidate's coding interview performance. Provide detailed, constructive feedback.

PROBLEM STATEMENT:
${problemPrompt}

CANDIDATE'S FINAL CODE:
\`\`\`
${finalCode}
\`\`\`

FULL INTERVIEW CONVERSATION:
${chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

EVALUATION CRITERIA (Score each out of 100):

1. **CORRECTNESS (0-100)**:
   - Does the solution solve the problem correctly?
   - Are edge cases handled?
   - Would it work for all valid inputs?
   - Consider: empty inputs, single elements, duplicates, boundary conditions
   
   Scoring Guide:
   - 90-100: Perfect solution, handles all edge cases
   - 80-89: Correct core logic, minor edge case issues
   - 70-79: Mostly correct, some logical errors
   - 60-69: Partially correct, significant issues
   - 50-59: Attempts solution but major flaws
   - 0-49: Incorrect or non-functional

2. **EFFICIENCY (0-100)**:
   - Time complexity optimization
   - Space complexity considerations
   - Appropriate data structures and algorithms
   
   Scoring Guide:
   - 90-100: Optimal time/space complexity
   - 80-89: Good efficiency, minor optimizations possible
   - 70-79: Reasonable approach, some inefficiencies
   - 60-69: Suboptimal but functional
   - 50-59: Inefficient approach
   - 0-49: Very poor efficiency or doesn't work

3. **CODE STYLE (0-100)**:
   - Readability and organization
   - Variable naming and comments
   - Code structure and formatting
   - Following best practices
   
   Scoring Guide:
   - 90-100: Excellent style, very readable
   - 80-89: Good style, minor improvements needed
   - 70-79: Decent style, some issues
   - 60-69: Poor style but understandable
   - 50-59: Hard to read, poor naming
   - 0-49: Very messy, difficult to understand

4. **COMMUNICATION (0-100)**:
   - How well did they explain their thought process?
   - Did they ask good questions?
   - How did they handle hints and feedback?
   - Problem-solving approach and reasoning
   
   Scoring Guide:
   - 90-100: Excellent communication throughout
   - 80-89: Good explanations, minor gaps
   - 70-79: Adequate communication
   - 60-69: Some communication, could be clearer
   - 50-59: Minimal communication
   - 0-49: Poor or no communication

5. **OVERALL (0-100)**:
   - Holistic assessment considering all factors
   - Would you recommend this candidate?
   - How did they handle the interview process?

RESPONSE FORMAT - Respond with ONLY valid JSON:
{
  "scores": {
    "correctness": [score 0-100],
    "efficiency": [score 0-100],
    "style": [score 0-100],
    "communication": [score 0-100],
    "overall": [score 0-100]
  },
  "feedback": "[Provide detailed, constructive feedback covering:\n- What they did well\n- Specific areas for improvement\n- Suggestions for optimization or alternative approaches\n- Comments on their problem-solving process\n- Encouragement and next steps\nMake it feel like feedback from a mentor, not just criticism. Be specific and actionable.]"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system' as const, 
          content: 'You are an expert coding interviewer. Respond ONLY with valid JSON. Be thorough but constructive in your feedback.' 
        },
        { role: 'user' as const, content: scoringPrompt }
      ],
      max_tokens: 1200,
      temperature: 0.2, // Lower temperature for more consistent scoring
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Clean up response in case of markdown formatting
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    const result = JSON.parse(cleanedContent) as ScoringResult;
    
    // Validate scores are within range (0-100)
    const scores = Object.values(result.scores);
    for (const score of scores) {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        throw new Error(`Invalid score: ${score}. Scores must be numbers between 0-100.`);
      }
    }

    // Ensure all required score categories exist
    const requiredCategories = ['correctness', 'efficiency', 'style', 'communication', 'overall'];
    for (const category of requiredCategories) {
      if (!(category in result.scores)) {
        throw new Error(`Missing score category: ${category}`);
      }
    }

    return result;
  } catch (error) {
    console.error('Scoring error:', error);
    
    // Return more realistic default scores for fallback
    return {
      scores: {
        correctness: 65,
        efficiency: 60,
        style: 70,
        communication: 65,
        overall: 65,
      },
      feedback: 'I apologize, but I encountered an issue while analyzing your solution. Your code shows a good attempt at solving the problem. I recommend reviewing your solution for correctness and considering edge cases. Focus on clear variable naming and explaining your thought process. Keep practicing - coding interviews improve with experience!',
    };
  }
}

export default openai; 