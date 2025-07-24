import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { scoreSolution } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { sessionId, finalCode } = await request.json();
    
    if (!sessionId || !finalCode) {
      return Response.json({ 
        error: 'sessionId and finalCode are required' 
      }, { status: 400 });
    }

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return Response.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Get AI scoring
    console.log('📊 Generating AI score for session:', sessionId);
    const { scores, feedback } = await scoreSolution(
      session.problemPrompt,
      finalCode,
      session.chatHistory
    );

    // Update session with final code and scores
    session.finalCode = finalCode;
    session.scores = scores;
    session.feedback = feedback;
    await session.save();

    console.log('✅ Session scored and saved:', sessionId, 'Overall:', scores.overall);

    return Response.json({ 
      success: true,
      scores,
      feedback,
      message: 'Code submitted and scored successfully'
    });

  } catch (error) {
    console.error('❌ Code submission failed:', error);
    return Response.json({ 
      success: false,
      error: 'Failed to submit and score code' 
    }, { status: 500 });
  }
} 