import { SPLIT_DIVIDER_SIZE, SPLIT_DIVIDER_SIZE_H } from '../../styles/ui-constants';

interface ResizableDividerProps {
  onResize: (delta: number) => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function ResizableDivider({ 
  onResize, 
  orientation = 'vertical',
  className = '' 
}: ResizableDividerProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    let lastPos = orientation === 'vertical' ? e.clientX : e.clientY;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = orientation === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - lastPos;
      lastPos = currentPos;
      onResize(delta);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('select-none');
    };
    
    document.body.classList.add('select-none');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const dividerClass = orientation === 'vertical' 
    ? `${SPLIT_DIVIDER_SIZE} cursor-col-resize hover:bg-blue-500`
    : `${SPLIT_DIVIDER_SIZE_H} cursor-row-resize hover:bg-blue-500`;

  return (
    <div
      className={`bg-gray-200 hover:bg-blue-500 transition-colors ${dividerClass} ${className}`}
      onMouseDown={handleMouseDown}
    />
  );
} 