import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    console.log('🔍 Fetching problem:', slug);
    
    // Server-side fetch to external LeetCode API (no CORS issues)
    const response = await fetch(`https://leetcode-api-pied.vercel.app/problem/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CodeMentor-AI/1.0'
      }
    });
    
    if (!response.ok) {
      console.error('❌ LeetCode API Error:', response.status, response.statusText);
      return Response.json(
        { error: `Problem not found: ${slug}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Successfully fetched problem:', data.title);
    
    // Return the raw data for now (we'll transform it later)
    return Response.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
    
  } catch (error) {
    console.error('❌ Server Error:', error);
    return Response.json(
      { error: 'Failed to fetch problem from LeetCode API' },
      { status: 500 }
    );
  }
} 