interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({ 
  variant = 'default', 
  size = 'default',
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = "rounded-lg transition-colors";
  const variantStyles = variant === 'default' 
    ? "bg-blue-500 text-white hover:bg-blue-600" 
    : "border border-gray-300 hover:bg-gray-100";
  
  const sizeStyles = {
    default: "px-4 py-2",
    sm: "px-2 py-1 text-sm",
    lg: "px-6 py-3 text-lg",
    icon: "p-2"
  }[size];
    
  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    />
  );
} 