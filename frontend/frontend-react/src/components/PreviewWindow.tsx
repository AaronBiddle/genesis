import React, { useEffect } from 'react';
import { TabbedWindowProps } from './TabbedWindow';
import { SplitIcon } from './icons/SplitIcon';
import { CloseIcon } from './icons/CloseIcon';

interface PreviewWindowProps extends TabbedWindowProps {
  windowId: string;
  onSplit?: (direction: 'horizontal' | 'vertical', windowId: string) => void;
  onClose?: () => void;
}

const TAB_STYLES = {
  ACTIVE: "px-3 py-2 bg-white border-t border-x rounded-t-lg shadow-sm",
  INACTIVE: "px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-t-lg"
} as const;

export function PreviewWindow({ windowId, onSplit, onClose, ...props }: PreviewWindowProps) {
  const handleSplitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onSplit) return;
    const direction = e.altKey ? 'vertical' : 'horizontal';
    console.log('PreviewWindow - Split requested:', { direction, windowId });
    onSplit(direction, windowId);
  };

  if (!props.documents || props.documents.length === 0) {
    console.log('PreviewWindow - No documents available');
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

  const activeDoc = props.documents.find(doc => doc.id === props.activeDocument) || props.documents[0];

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      <div className="border-b bg-gray-50 flex items-center">
        <div className="flex px-2 gap-1">
          {props.documents.map(doc => (
            <div 
              key={doc.id}
              className={doc.id === props.activeDocument ? TAB_STYLES.ACTIVE : TAB_STYLES.INACTIVE}
              onClick={() => props.onDocumentChange(doc.id)}
              role="button"
            >
              {doc.title || 'Untitled'}
            </div>
          ))}
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
          value={activeDoc.content}
          onChange={(e) => {
            console.log('PreviewWindow - TextArea onChange:', {
              docId: activeDoc.id,
              newContent: e.target.value,
              currentDocContent: activeDoc.content
            });
            props.onDocumentContentChange(activeDoc.id, e.target.value);
          }}
          className="w-full h-full resize-none border-0 p-2 focus:outline-none focus:ring-0"
          placeholder="Enter your content here..."
        />
      </div>
    </div>
  );
} 