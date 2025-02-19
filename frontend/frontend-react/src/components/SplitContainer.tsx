import { PreviewWindow } from './PreviewWindow';
import { WindowLayout } from '../types/WindowLayout';
import { ResizableDivider } from './ui/resizable';
import { useState } from 'react';

interface SplitContainerProps {
  layout: WindowLayout;
  onSplit: (layout: NonNullable<WindowLayout>, direction: 'horizontal' | 'vertical', windowId: string) => void;
  onClose: (layout: NonNullable<WindowLayout>) => void;
  isRoot?: boolean;
}

export const SplitContainer: React.FC<SplitContainerProps> = ({ layout, onSplit, onClose }) => {
  if (!layout) {
    return null;
  }

  if (layout.type === "leaf") {
    return (
      <div className="flex-1 w-full h-full">
        <PreviewWindow 
          windowId={layout.id}
          onSplit={(direction) => onSplit(layout, direction, layout.id)}
          onClose={() => onClose(layout)}
          {...layout.tabProps}
        />
      </div>
    );
  } else {
    const [firstSize, setFirstSize] = useState(50); // percentage
    const flexDirection = layout.direction === "horizontal" ? "flex-row" : "flex-col";
    
    const handleResize = (delta: number) => {
      const containerRect = document.getElementById('split-container')?.getBoundingClientRect();
      if (!containerRect) return;
      
      const totalSize = layout.direction === 'horizontal' ? containerRect.width : containerRect.height;
      const deltaPercent = (delta / totalSize) * 100;
      
      setFirstSize(prev => {
        const newSize = prev + deltaPercent;
        return Math.min(Math.max(newSize, 20), 80); // Limit between 20% and 80%
      });
    };

    return (
      <div id="split-container" className={`flex ${flexDirection} w-full h-full`}>
        <div style={{ flex: `${firstSize} 1 0%` }}>
          <SplitContainer 
            layout={layout.first} 
            onSplit={onSplit} 
            onClose={onClose}
            isRoot={false} 
          />
        </div>
        <ResizableDivider 
          onResize={handleResize}
          orientation={layout.direction === 'horizontal' ? 'vertical' : 'horizontal'}
        />
        <div style={{ flex: `${100 - firstSize} 1 0%` }}>
          <SplitContainer 
            layout={layout.second} 
            onSplit={onSplit} 
            onClose={onClose}
            isRoot={false} 
          />
        </div>
      </div>
    );
  }
};