import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { generateInterviewerResponse } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { sessionId, message } = await request.json();
    
    if (!sessionId || !message) {
      return Response.json({ 
        error: 'sessionId and message are required' 
      }, { status: 400 });
    }

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return Response.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Generate AI response
    console.log('🤖 Generating AI response for session:', sessionId);
    const aiResponse = await generateInterviewerResponse(
      session.problemPrompt,
      session.chatHistory,
      message
    );

    // Update chat history
    session.chatHistory.push(
      { 
        role: 'user', 
        content: message, 
        timestamp: new Date() 
      },
      { 
        role: 'assistant', 
        content: aiResponse, 
        timestamp: new Date() 
      }
    );
    
    await session.save();
    console.log('✅ Chat history updated for session:', sessionId);

    return Response.json({ 
      success: true,
      response: aiResponse,
      message: 'Chat message processed successfully'
    });

  } catch (error) {
    console.error('❌ Chat processing failed:', error);
    return Response.json({ 
      success: false,
      error: 'Failed to process chat message' 
    }, { status: 500 });
  }
} 