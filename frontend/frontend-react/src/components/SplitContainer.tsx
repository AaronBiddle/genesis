import React from "react";
import { TabbedWindow, TabbedWindowProps } from "./TabbedWindow";

export type WindowLayout =
  | {
      type: "leaf";
      tabProps: TabbedWindowProps;
    }
  | {
      type: "split";
      // You can choose either "horizontal" or "vertical" for the split direction.
      direction: "horizontal" | "vertical";
      first: WindowLayout;
      second: WindowLayout;
    };

interface SplitContainerProps {
  layout: WindowLayout;
}

export const SplitContainer: React.FC<SplitContainerProps> = ({ layout }) => {
  if (layout.type === "leaf") {
    // Leaf node: contains a TabbedWindow.
    return (
      <div className="flex-grow h-full">
        <TabbedWindow {...layout.tabProps} />
      </div>
    );
  } else {
    // Internal node: split into two child SplitContainers.
    const flexDirection = layout.direction === "horizontal" ? "flex-row" : "flex-col";
    return (
      <div className={`flex flex-grow ${flexDirection}`}>
        <SplitContainer layout={layout.first} />
        <SplitContainer layout={layout.second} />
      </div>
    );
  }
}; 