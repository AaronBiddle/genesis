import { PreviewWindow } from './PreviewWindow';
import { WindowLayout } from '../types/layout';
import { SPLIT_WINDOW_GAP } from '../styles/ui-constants';

interface SplitContainerProps {
  layout: WindowLayout;
  onSplit?: (layout: WindowLayout, direction: 'vertical' | 'horizontal') => void;
  isRoot?: boolean;
}

export const SplitContainer: React.FC<SplitContainerProps> = ({ layout, onSplit, isRoot = true }) => {
  if (layout.type === "leaf") {
    return (
      <div className="flex-1 w-full h-full">
        <PreviewWindow 
          {...layout.tabProps} 
          onSplit={(direction) => onSplit?.(layout, direction)}
        />
      </div>
    );
  } else {
    const flexDirection = layout.direction === "horizontal" ? "flex-row" : "flex-col";
    return (
      <div className={`flex ${flexDirection} ${SPLIT_WINDOW_GAP} w-full h-full`}>
        <div className="flex-1">
          <SplitContainer layout={layout.first} onSplit={onSplit} isRoot={false} />
        </div>
        <div className="flex-1">
          <SplitContainer layout={layout.second} onSplit={onSplit} isRoot={false} />
        </div>
      </div>
    );
  }
};