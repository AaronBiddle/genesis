interface InputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  minHeight?: number;
  maxHeight?: number;
}

export function Input({ className = '', minHeight = 100, maxHeight = 200, ...props }: InputProps) {
  return (
    <textarea
      className={`border rounded-lg px-3 py-2 w-full min-h-[${minHeight}px] max-h-[${maxHeight}px] resize-none overflow-y-auto ${className}`}
      {...props}
    />
  );
} 