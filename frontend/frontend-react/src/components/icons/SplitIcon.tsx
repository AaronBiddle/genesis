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
        d="M7 1H3C2.44772 1 2 1.44772 2 2V14C2 14.5523 2.44772 15 3 15H7V1ZM9 1V15H13C13.5523 15 14 14.5523 14 14V2C14 1.44772 13.5523 1 13 1H9Z"
        fill="currentColor"
      />
    </svg>
  );
} 