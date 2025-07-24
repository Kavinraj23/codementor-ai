import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';

export async function GET() {
  try {
    // Test database connection
    await dbConnect();
    console.log('✅ Database connected successfully');

    // Test creating a sample session
    const testSession = await Session.create({
      userEmail: 'test@example.com',
      problemPrompt: 'Two Sum Problem: Given an array of integers, return indices of two numbers that add up to target.',
      chatHistory: [
        { role: 'user', content: 'I need help with this problem', timestamp: new Date() },
        { role: 'assistant', content: 'Let me help you break this down step by step.', timestamp: new Date() }
      ],
      finalCode: 'function twoSum(nums, target) { /* solution */ }',
      scores: {
        correctness: 85,
        efficiency: 78,
        style: 92,
        communication: 88,
        overall: 86
      },
      feedback: 'Great job! Your solution is correct and well-structured.'
    });

    console.log('✅ Test session created:', testSession._id);

    // Test querying sessions
    const sessions = await Session.find({ userEmail: 'test@example.com' });
    console.log('✅ Found sessions:', sessions.length);

    return Response.json({ 
      success: true, 
      message: 'Database connection and operations successful!',
      testSessionId: testSession._id,
      sessionsFound: sessions.length
    });

  } catch (error) {
    console.error('❌ Database test failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    
    // Clean up test data
    const result = await Session.deleteMany({ userEmail: 'test@example.com' });
    console.log('🧹 Cleaned up test sessions:', result.deletedCount);

    return Response.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} test sessions`
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 