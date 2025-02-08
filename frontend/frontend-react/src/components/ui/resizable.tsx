interface ResizableDividerProps {
  onResize: (delta: number) => void;
  className?: string;
}

export function ResizableDivider({ onResize, className = '' }: ResizableDividerProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      onResize(delta);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize ${className}`}
      onMouseDown={handleMouseDown}
    />
  );
} 