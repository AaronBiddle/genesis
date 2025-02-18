import React from 'react';
import { TabbedWindowProps } from './TabbedWindow';
import { SplitIcon } from './icons/SplitIcon';

interface PreviewWindowProps extends TabbedWindowProps {
  onSplit?: (direction: 'vertical' | 'horizontal') => void;
}

export function PreviewWindow({ onSplit, ...props }: PreviewWindowProps) {
  const doc = props.documents[0]; // We know we only have one document in preview

  const handleSplitClick = (e: React.MouseEvent) => {
    if (!onSplit) return;
    const direction = e.altKey ? 'vertical' : 'horizontal';
    onSplit(direction);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-2 bg-gray-50 flex items-center justify-between">
        <span>{doc.title}</span>
        <button
          onClick={handleSplitClick}
          className="p-1 hover:bg-gray-200 rounded group relative"
          title="Split Editor Down"
        >
          <SplitIcon className="w-4 h-4" />
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded bottom-full mb-2 whitespace-nowrap">
            [Alt] Split Editor Down
          </span>
        </button>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={doc.content}
          onChange={(e) => props.onDocumentContentChange(doc.id, e.target.value)}
          className="w-full h-full resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your content here..."
        />
      </div>
    </div>
  );
} 