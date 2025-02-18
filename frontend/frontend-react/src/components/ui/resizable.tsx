import { SPLIT_DIVIDER_SIZE, SPLIT_DIVIDER_SIZE_H, SPLIT_DIVIDER_HIGHLIGHT } from '../../styles/ui-constants';

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
    ? `${SPLIT_DIVIDER_SIZE} cursor-col-resize`
    : `${SPLIT_DIVIDER_SIZE_H} cursor-row-resize`;

  return (
    <div
      className={`bg-transparent transition-colors ${SPLIT_DIVIDER_HIGHLIGHT} ${dividerClass} ${className}`}
      onMouseDown={handleMouseDown}
    />
  );
} 