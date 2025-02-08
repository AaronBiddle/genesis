interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
}

export function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  const baseStyles = "px-4 py-2 rounded-lg transition-colors";
  const variantStyles = variant === 'default' 
    ? "bg-blue-500 text-white hover:bg-blue-600" 
    : "border border-gray-300 hover:bg-gray-100";
    
  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    />
  );
} 