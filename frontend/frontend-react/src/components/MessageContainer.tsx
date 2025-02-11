import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types/chat';

interface MessageContainerProps {
  message: ChatMessage;
  index: number;
  onRemove: (index: number) => void;
}

export function MessageContainer({ message, index, onRemove }: MessageContainerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative mb-4 ${message.role === 'assistant' ? 'pl-4' : 'pr-4'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`p-2 rounded-lg markdown-content ${
          message.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-100 ml-auto'
        }`}
      >
        {isHovered && (
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Remove message"
          >
            ×
          </button>
        )}
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
} 