import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Interview from '@/models/Interview';

// Create new session
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      problemId,
      problemTitle,
      problemDifficulty,
      currentCode,
      userId
    } = body;

    // Validate required fields
    if (!problemId || !problemTitle || !problemDifficulty || !currentCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: problemId, problemTitle, problemDifficulty, currentCode',
        },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new interview session
    const session = new Interview({
      sessionId,
      problemId,
      problemTitle,
      problemDifficulty,
      startTime: new Date(),
      duration: 0,
      status: 'active',
      currentCode,
      testResults: [],
      messages: [],
      elapsedTime: 0,
      performanceMetrics: {
        testCasesPassed: 0,
        totalTestCases: 0,
        successRate: 0,
        timeEfficiency: 0,
        codeQuality: 0
      },
      aiFeedback: {
        summary: '',
        strengths: [],
        improvements: [],
        overallScore: 0
      },
      userId: userId || null
    });

    const savedSession = await session.save();

    return NextResponse.json({
      success: true,
      data: savedSession,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create session',
      },
      { status: 500 }
    );
  }
}

// Get all sessions (for dashboard)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch sessions with pagination
    const sessions = await Interview.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Interview.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sessions',
      },
      { status: 500 }
    );
  }
}
