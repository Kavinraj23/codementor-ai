import { NextRequest, NextResponse } from 'next/server';

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!JUDGE0_API_KEY) {
      return NextResponse.json(
        { error: 'Judge0 API key not configured' },
        { status: 500 }
      );
    }

    const { source_code, language_id, stdin } = await request.json();

    if (!source_code || !language_id) {
      return NextResponse.json(
        { error: 'Missing required fields: source_code, language_id' },
        { status: 400 }
      );
    }

    // Submit code for execution
    const submitResponse = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        source_code,
        language_id: parseInt(language_id),
        stdin: stdin || '',
        expected_output: '',
        cpu_time_limit: 5,
        memory_limit: 128000,
        enable_network: false
      })
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('Judge0 submit error:', errorText);
      return NextResponse.json(
        { error: `Judge0 submission failed: ${submitResponse.statusText}` },
        { status: submitResponse.status }
      );
    }

    const submission = await submitResponse.json();
    const token = submission.token;

    // Wait for execution to complete
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait time
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
      });

      if (!statusResponse.ok) {
        console.error('Judge0 status check failed:', statusResponse.statusText);
        break;
      }

      const result = await statusResponse.json();
      
             // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit Exceeded, 6=Compilation Error
       // For our use case, we want to return results for status 3 (Accepted) and 4 (Wrong Answer) since both mean the code executed
       if (result.status.id === 3 || result.status.id === 4) {
         return NextResponse.json(result);
       }
      
      attempts++;
    }

    // Timeout
    return NextResponse.json(
      { error: 'Execution timeout' },
      { status: 408 }
    );

  } catch (error) {
    console.error('Execute API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
