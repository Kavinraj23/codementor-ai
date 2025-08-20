import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageRendererProps {
  content: string;
  role: 'user' | 'assistant';
  onCodeInsert?: (code: string) => void;
}

export default function ChatMessageRenderer({ content, role, onCodeInsert }: ChatMessageRendererProps) {
  // Parse message content to detect code blocks
  const parseContent = (text: string) => {
    // Regex to match code blocks with optional language
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index).trim();
        if (beforeText) {
          parts.push({
            type: 'text',
            content: beforeText,
            key: `text-${lastIndex}`,
          });
        }
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2].trim();
      parts.push({
        type: 'code',
        language: language,
        content: code,
        key: `code-${match.index}`,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last code block
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex).trim();
      if (remainingText) {
        parts.push({
          type: 'text',
          content: remainingText,
          key: `text-${lastIndex}`,
        });
      }
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text, key: 'text-0' }];
  };

  const parts = parseContent(content);

  return (
    <div className="space-y-3">
      {parts.map((part) => {
        if (part.type === 'code') {
          return (
            <div key={part.key} className="relative">
              {/* Language badge and actions */}
              <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 text-gray-300 px-4 py-2 rounded-t-lg text-sm">
                <span className="font-medium capitalize">{part.language}</span>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(String(part.content || ''));
                        // Could add toast notification here
                      } catch (error) {
                        console.error('Failed to copy:', error);
                      }
                    }}
                    className="text-gray-400 hover:text-gray-200 transition-colors text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                    title="Copy code"
                  >
                    📋 Copy
                  </button>
                  {role === 'assistant' && onCodeInsert && part.language === 'python' && (
                    <button
                      onClick={() => onCodeInsert(String(part.content || ''))}
                      className="text-gray-400 hover:text-gray-200 transition-colors text-xs bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded"
                      title="Replace code in editor"
                    >
                      ↻ Replace in Editor
                    </button>
                  )}
                </div>
              </div>
              
              {/* Code block with syntax highlighting */}
              <SyntaxHighlighter
                language={part.language}
                style={vscDarkPlus}
                className="!mt-0 !rounded-t-none !rounded-b-lg"
                customStyle={{
                  margin: 0,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}
                showLineNumbers={String(part.content || '').split('\n').length > 5}
                wrapLines={true}
                wrapLongLines={true}
              >
                {String(part.content || '')}
              </SyntaxHighlighter>
            </div>
          );
        } else {
          // Regular text with basic markdown support
          return (
            <div
              key={part.key}
              className="whitespace-pre-wrap text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: String(part.content || '')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
                  .replace(/\n/g, '<br />'),
              }}
            />
          );
        }
      })}
    </div>
  );
}