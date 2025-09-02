import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import Interview from '@/models/Interview';

// Get session by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    await connectDB();

    const session = await Interview.findOne({ 
      sessionId: params.sessionId,
      userId: userId // Only allow access to user's own sessions
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch session',
      },
      { status: 500 }
    );
  }
}

// Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      currentCode,
      testResults,
      messages,
      elapsedTime,
      status,
      endTime,
      duration,
      performanceMetrics,
      aiFeedback,
      aiEvaluation
    } = body;

    // Find and update session (only user's own sessions)
    const session = await Interview.findOneAndUpdate(
      { 
        sessionId: params.sessionId,
        userId: userId // Only allow updates to user's own sessions
      },
      {
        ...(currentCode && { currentCode }),
        ...(testResults && { testResults }),
        ...(messages && { messages }),
        ...(elapsedTime !== undefined && { elapsedTime }),
        ...(status && { status }),
        ...(endTime && { endTime }),
        ...(duration !== undefined && { duration }),
        ...(performanceMetrics && { performanceMetrics }),
        ...(aiFeedback && { aiFeedback }),
        ...(aiEvaluation && { aiEvaluation }),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update session',
      },
      { status: 500 }
    );
  }
}

// Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    await connectDB();

    const session = await Interview.findOneAndDelete({ 
      sessionId: params.sessionId,
      userId: userId // Only allow deletion of user's own sessions
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete session',
      },
      { status: 500 }
    );
  }
}
