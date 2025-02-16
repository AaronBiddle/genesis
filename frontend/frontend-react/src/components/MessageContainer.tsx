import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types/chat';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faFileAlt } from '@fortawesome/free-solid-svg-icons';

interface MessageContainerProps {
  message: ChatMessage;
  index: number;
  onRemove: (index: number) => void;
}

export function MessageContainer({ message, index, onRemove }: MessageContainerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

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
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center hover:bg-gray-600 transition-colors"
              title="Toggle raw markdown"
            >
              <FontAwesomeIcon icon={showRaw ? faCode : faFileAlt} className="h-3 w-3" />
            </button>
            <button
              onClick={() => onRemove(index)}
              className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Remove message"
            >
              ×
            </button>
          </div>
        )}
        {showRaw ? (
          <pre className="whitespace-pre-wrap font-mono text-sm">{message.content}</pre>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
} 