import React from "react";

interface SplitViewManagerProps {
  children: React.ReactNode; // Initially, just one pane
}

export const SplitViewManager: React.FC<SplitViewManagerProps> = ({ children }) => {
  // For now, only support a single pane (1x1)
  return <div className="w-full h-full flex flex-col flex-grow">{children}</div>;
}; 