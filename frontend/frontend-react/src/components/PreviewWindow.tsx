import React from 'react';
import { TabbedWindowProps } from './TabbedWindow';
import { SplitIcon } from './icons/SplitIcon';
import { CloseIcon } from './icons/CloseIcon';

interface PreviewWindowProps extends TabbedWindowProps {
  onSplit?: (direction: 'vertical' | 'horizontal') => void;
  onClose?: () => void;
}

export function PreviewWindow({ onSplit, onClose, ...props }: PreviewWindowProps) {
  const handleSplitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onSplit) return;
    const direction = e.altKey ? 'vertical' : 'horizontal';
    onSplit(direction);
  };

  if (!props.documents || props.documents.length === 0) {
    return (
      <div className="flex flex-col h-full border rounded-lg overflow-hidden">
        <div className="border-b bg-gray-50 flex items-center">
          <div className="flex-grow flex justify-end px-2 gap-1">
            <div className="relative">
              <button
                onClick={handleSplitClick}
                className="p-1 hover:bg-gray-200 rounded"
                title="Split Editor Down"
              >
                <SplitIcon className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
              title="Close Editor"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No document open
        </div>
      </div>
    );
  }

  const doc = props.documents[0];

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      <div className="border-b bg-gray-50 flex items-center">
        <div className="flex px-2 gap-1">
          <div className="px-3 py-2 bg-white border-t border-x rounded-t-lg shadow-sm">
            {doc.title}
          </div>
        </div>
        <div className="flex-grow flex justify-end px-2 gap-1">
          <div className="relative">
            <button
              onClick={handleSplitClick}
              className="p-1 hover:bg-gray-200 rounded"
              title="Split Editor Down"
            >
              <SplitIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
            title="Close Editor"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1">
        <textarea
          value={doc.content}
          onChange={(e) => props.onDocumentContentChange(doc.id, e.target.value)}
          className="w-full h-full resize-none border-0 p-2 focus:outline-none focus:ring-0"
          placeholder="Enter your content here..."
        />
      </div>
    </div>
  );
} 