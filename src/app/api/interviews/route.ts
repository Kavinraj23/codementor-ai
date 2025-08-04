import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Interview from '@/models/Interview';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
    if (userId) {
      query.userId = userId;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch interviews with pagination and sorting
    const interviews = await Interview.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Interview.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        interviews,
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
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch interviews',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      userId,
      problemTitle,
      problemDifficulty,
      language,
      code,
      score,
      feedback,
      duration,
      status = 'completed',
    } = body;

    // Validate required fields
    if (!userId || !problemTitle || !problemDifficulty || !language || !code || !score || !feedback || duration === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate score object
    const requiredScoreFields = ['correctness', 'efficiency', 'codeStyle', 'communication', 'overall'];
    for (const field of requiredScoreFields) {
      if (score[field] === undefined || score[field] < 0 || score[field] > 100) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid score.${field}: must be between 0 and 100`,
          },
          { status: 400 }
        );
      }
    }

    // Create new interview
    const interview = new Interview({
      userId,
      problemTitle,
      problemDifficulty,
      language,
      code,
      score,
      feedback,
      duration,
      status,
    });

    const savedInterview = await interview.save();

    return NextResponse.json({
      success: true,
      data: savedInterview,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create interview',
      },
      { status: 500 }
    );
  }
}