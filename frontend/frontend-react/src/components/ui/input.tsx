interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`border rounded-lg px-3 py-2 w-full ${className}`}
      {...props}
    />
  );
} 