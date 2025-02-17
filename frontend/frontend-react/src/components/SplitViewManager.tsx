import React from "react";

interface SplitViewManagerProps {
  children: React.ReactNode; // Initially, just one pane
}

export function SplitViewManager({ children }: SplitViewManagerProps) {
  return (
    <div className="flex flex-row h-full w-full">
      {children}
    </div>
  );
} 