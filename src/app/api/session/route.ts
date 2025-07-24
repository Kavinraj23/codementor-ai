/**
 * Session API Route - Create New Interview Sessions
 * 
 * POST /api/session
 * Creates a new coding interview session in the database
 * 
 * Request Body:
 * - userEmail: string (user's email address)
 * - problemPrompt: string (the coding problem description)
 * 
 * Response:
 * - success: boolean
 * - sessionId: string (MongoDB ObjectId for the created session)
 * - message: string
 * 
 * This is the first step in the interview flow:
 * 1. Create session (this endpoint)
 * 2. Chat with AI (/api/chat)
 * 3. Submit code (/api/submit)
 */

import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { userEmail, problemPrompt } = await request.json();
    
    if (!userEmail || !problemPrompt) {
      return Response.json({ 
        error: 'userEmail and problemPrompt are required' 
      }, { status: 400 });
    }

    // Create new interview session (providng default/empty parameters)
    const session = await Session.create({
      userEmail,
      problemPrompt,
      chatHistory: [],
      finalCode: '',
      scores: {
        correctness: 0,
        efficiency: 0,
        style: 0,
        communication: 0,
        overall: 0
      },
      feedback: ''
    });

    console.log('✅ New session created:', session._id);

    return Response.json({ 
      success: true,
      sessionId: session._id,
      message: 'Interview session created successfully'
    });

  } catch (error) {
    console.error('❌ Session creation failed:', error);
    return Response.json({ 
      success: false,
      error: 'Failed to create interview session' 
    }, { status: 500 });
  }
} 