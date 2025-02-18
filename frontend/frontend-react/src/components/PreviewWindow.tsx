import React from 'react';
import { TabbedWindowProps } from './TabbedWindow';
import { SplitIcon } from './icons/SplitIcon';

interface PreviewWindowProps extends TabbedWindowProps {
  onSplit?: (direction: 'vertical' | 'horizontal') => void;
}

export function PreviewWindow({ onSplit, ...props }: PreviewWindowProps) {
  const doc = props.documents[0];

  const handleSplitClick = (e: React.MouseEvent) => {
    if (!onSplit) return;
    const direction = e.altKey ? 'vertical' : 'horizontal';
    onSplit(direction);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-gray-50 flex items-center">
        <div className="flex px-2 gap-1">
          <div className="px-3 py-2 bg-white border-t border-x rounded-t-lg shadow-sm">
            index.ts
          </div>
          <div className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-t-lg">
            README.md
          </div>
        </div>
        <div className="flex-grow flex justify-end px-2">
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