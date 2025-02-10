interface InputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <textarea
      className={`border rounded-lg px-3 py-2 w-full min-h-[100px] max-h-[200px] resize-none overflow-y-auto ${className}`}
      {...props}
    />
  );
} 