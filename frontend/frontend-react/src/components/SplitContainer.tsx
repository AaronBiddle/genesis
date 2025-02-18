import React from "react";
import { TabbedWindow } from "./TabbedWindow";
import { WindowLayout } from "../types/layout";
import { PreviewWindow } from './PreviewWindow';

interface SplitContainerProps {
  layout: WindowLayout;
  onSplit?: (layout: WindowLayout, direction: 'vertical' | 'horizontal') => void;
}

export const SplitContainer: React.FC<SplitContainerProps> = ({ layout, onSplit }) => {
  if (layout.type === "leaf") {
    // Leaf node: contains a TabbedWindow.
    return (
      <div className="flex-1 w-full h-full border-2 border-red-500 p-2">
        <div className="w-full h-full border-2 border-blue-500">
          <PreviewWindow 
            {...layout.tabProps} 
            onSplit={(direction) => onSplit?.(layout, direction)}
          />
        </div>
      </div>
    );
  } else {
    // Internal node: split into two child SplitContainers.
    const flexDirection = layout.direction === "horizontal" ? "flex-row" : "flex-col";
    return (
      <div className={`flex ${flexDirection} w-full h-full border-2 border-red-500 p-2`}>
        <div className="flex-1 border-2 border-blue-500">
          <SplitContainer layout={layout.first} onSplit={onSplit} />
        </div>
        <div className="flex-1 border-2 border-blue-500">
          <SplitContainer layout={layout.second} onSplit={onSplit} />
        </div>
      </div>
    );
  }
}; 