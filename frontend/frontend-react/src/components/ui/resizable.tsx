import { useState, useEffect } from 'react';

interface ResizableDividerProps {
  onResize: (delta: number) => void;
  className?: string;
}

export function ResizableDivider({ onResize, className = '' }: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      onResize(delta);
      setStartX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, onResize]);

  return (
    <div className="w-1 select-none" style={{ cursor: 'col-resize' }}>
      <div
        className={`h-full w-full hover:bg-blue-400 active:bg-blue-500 transition-colors flex justify-center ${className}`}
        onMouseDown={(e) => {
          setIsDragging(true);
          setStartX(e.clientX);
        }}
      >
        <div className="w-0.5 h-full rounded-full" />
      </div>
    </div>
  );
} 