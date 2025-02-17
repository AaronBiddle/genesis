interface ResizableDividerProps {
  onResize: (delta: number) => void;
  className?: string;
}

export function ResizableDivider({ onResize, className = '' }: ResizableDividerProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    let lastX = e.clientX;  // Track the last X position

    const handleMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      const delta = currentX - lastX;  // Calculate delta from last position
      lastX = currentX;  // Update last position
      onResize(delta);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Re-enable text selection
      document.body.classList.remove('select-none');
    };
    
    // Disable text selection while dragging
    document.body.classList.add('select-none');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize select-none ${className}`}
      onMouseDown={handleMouseDown}
    />
  );
} 