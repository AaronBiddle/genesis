import React from 'react';

export function SplitIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      className={className}
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M7 1H5C4.44772 1 4 1.44772 4 2V14C4 14.5523 4.44772 15 5 15H7V1ZM9 1V15H11C11.5523 15 12 14.5523 12 14V2C12 1.44772 11.5523 1 11 1H9Z"
        fill="currentColor"
      />
    </svg>
  );
} 