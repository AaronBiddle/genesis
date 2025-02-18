import { PreviewWindow } from './PreviewWindow';
import { WindowLayout } from '../types/layout';

interface SplitContainerProps {
  layout: WindowLayout;
  onSplit?: (layout: WindowLayout, direction: 'vertical' | 'horizontal') => void;
  isRoot?: boolean;
}

export const SplitContainer: React.FC<SplitContainerProps> = ({ layout, onSplit, isRoot = true }) => {
  if (layout.type === "leaf") {
    return (
      <div className="flex-1 w-full h-full border-2 border-red-500">
        <div className="w-full h-full border-2 border-blue-500">
          <PreviewWindow 
            {...layout.tabProps} 
            onSplit={(direction) => onSplit?.(layout, direction)}
          />
        </div>
      </div>
    );
  } else {
    const flexDirection = layout.direction === "horizontal" ? "flex-row" : "flex-col";
    const gapClass = layout.direction === "horizontal" ? "gap-x-2" : "gap-y-2";
    return (
      <div className={`flex ${flexDirection} ${gapClass} w-full h-full border-2 border-red-500`}>
        <div className="flex-1 border-2 border-blue-500">
          <SplitContainer layout={layout.first} onSplit={onSplit} isRoot={false} />
        </div>
        <div className="flex-1 border-2 border-blue-500">
          <SplitContainer layout={layout.second} onSplit={onSplit} isRoot={false} />
        </div>
      </div>
    );
  }
};