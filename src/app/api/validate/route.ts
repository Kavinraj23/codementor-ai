import { NextRequest, NextResponse } from 'next/server';

// Simple Python syntax validator
function validatePythonSyntax(code: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic syntax checks
  const lines = code.split('\n');
  let indentLevel = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // Check for unmatched quotes
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if ((char === '"' || char === "'") && (j === 0 || line[j-1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
    }
    
    // Check indentation
    const leadingSpaces = line.length - line.trimStart().length;
    const expectedIndent = indentLevel * 4;
    
    if (leadingSpaces < expectedIndent && trimmedLine) {
      errors.push(`Line ${i + 1}: Incorrect indentation`);
    }
    
    // Update indent level based on colons
    if (trimmedLine.endsWith(':')) {
      indentLevel++;
    }
    
    // Decrease indent level for return, break, continue, pass
    if (trimmedLine.startsWith('return ') || 
        trimmedLine === 'return' ||
        trimmedLine === 'break' ||
        trimmedLine === 'continue' ||
        trimmedLine === 'pass') {
      indentLevel = Math.max(0, indentLevel - 1);
    }
  }
  
  // Check for unmatched quotes at end
  if (inString) {
    errors.push('Unmatched quotes detected');
  }
  
  // Check for basic Python keywords and structure
  const codeLower = code.toLowerCase();
  const hasDef = codeLower.includes('def ');
  const hasReturn = codeLower.includes('return');
  
  if (!hasDef) {
    errors.push('No function definition found (missing "def")');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(request: NextRequest) {
  try {
    const { source_code, test_cases } = await request.json();

    if (!source_code) {
      return NextResponse.json(
        { error: 'Missing source_code' },
        { status: 400 }
      );
    }

    // Validate Python syntax
    const validation = validatePythonSyntax(source_code);
    
    if (!validation.isValid) {
      return NextResponse.json({
        status: {
          id: 6, // Compilation Error
          description: 'Syntax Error'
        },
        stderr: validation.errors.join('\n'),
        stdout: '',
        compile_output: validation.errors.join('\n'),
        message: 'Python syntax validation failed'
      });
    }

    // Basic structure analysis
    const analysis = {
      hasFunction: source_code.includes('def '),
      hasReturn: source_code.includes('return'),
      hasPrint: source_code.includes('print('),
      lineCount: source_code.split('\n').length,
      characterCount: source_code.length
    };

    return NextResponse.json({
      status: {
        id: 3, // Accepted (syntax-wise)
        description: 'Syntax Valid'
      },
      stdout: 'Code syntax is valid',
      stderr: '',
      compile_output: '',
      analysis,
      message: 'Code passed basic syntax validation'
    });

  } catch (error) {
    console.error('Validate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
