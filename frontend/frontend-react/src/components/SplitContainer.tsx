import React from "react";

interface SplitContainerProps {
  children: React.ReactNode; // Can hold a TabbedWindow or two SplitContainers
}

export const SplitContainer: React.FC<SplitContainerProps> = ({ children }) => {
  return (
    <div className="flex flex-grow">
      {children}
    </div>
  );
}; 