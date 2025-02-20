import React from 'react';
import { TabbedWindowProps } from './TabbedWindow';
import { SplitIcon } from './icons/SplitIcon';
import { useLoggingStore, LogLevel } from '../stores/loggingStore';

interface PreviewWindowProps extends TabbedWindowProps {
  windowId: string;
  onSplit?: (direction: 'horizontal' | 'vertical', windowId: string) => void;
  onClose?: () => void;
}

export function PreviewWindow({ windowId, onSplit, onClose, ...props }: PreviewWindowProps) {
  const log = useLoggingStore(state => state.log);
  const namespace = 'PreviewWindow:';

  const handleSplitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onSplit) return;
    const direction = e.altKey ? 'vertical' : 'horizontal';
    log(LogLevel.DEBUG, namespace, 'Split requested:', { direction, windowId });
    onSplit(direction, windowId);
  };

  if (!props.documents || props.documents.length === 0) {
    log(LogLevel.DEBUG, namespace, 'No documents available');
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
              className={`px-3 py-1.5 text-sm font-medium rounded-t-lg relative group
                ${doc.id === props.activeDocument
                  ? 'bg-white shadow-sm font-bold border-b-2 border-primary -mb-px'
                  : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => props.onDocumentChange(doc.id)}
              role="button"
            >
              <span className="flex items-center">
                {doc.title || 'Untitled'}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onDocumentClose(doc.id);
                    if (props.documents.length === 1) {
                      onClose && onClose();
                    }
                  }}
                  className="ml-2 opacity-0 group-hover:opacity-100 group-data-[state=active]:opacity-100 hover:bg-gray-200 rounded-full h-4 w-4 inline-flex items-center justify-center transition-opacity cursor-pointer"
                  aria-label="Close tab"
                >
                  ×
                </span>
              </span>
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
        </div>
      </div>
      <div className="flex-1">
        <textarea
          value={activeDoc.content}
          onChange={(e) => {
            log(LogLevel.DEBUG, namespace, 'TextArea onChange:', {
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