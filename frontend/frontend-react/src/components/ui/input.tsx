import { useEffect, useRef } from 'react';

interface InputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  minHeight?: number;
  maxHeight?: number;
}

export function Input({ className = '', minHeight = 100, maxHeight = 200, value, ...props }: InputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to min to get correct scrollHeight
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value, minHeight, maxHeight]);

  return (
    <textarea
      ref={textareaRef}
      className={`border rounded-lg px-3 py-2 w-full resize-none overflow-y-auto ${className}`}
      style={{ 
        minHeight: `${minHeight}px`,
        maxHeight: `${maxHeight}px`,
        height: `${minHeight}px`, // Initial height
      }}
      value={value}
      {...props}
    />
  );
} 