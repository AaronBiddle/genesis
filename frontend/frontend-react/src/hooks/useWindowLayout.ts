import { useState, useCallback } from 'react';
import { WindowLayout, TabProps } from '../types/WindowLayout';

interface DocumentHandlers {
  onDocumentChange: (id: string) => void;
  onDocumentContentChange: (id: string, content: string) => void;
  onDocumentClose: (id: string) => void;
  documents: Array<{ id: string; title: string; content: string }>;
  activeDocument: string | null;
  markdownEnabled: boolean;
}

export function useWindowLayout() {
  const [windowLayout, setWindowLayout] = useState<WindowLayout>(null);

  const createNewSplit = useCallback((handlers: DocumentHandlers) => {
    if (!windowLayout) {
      setWindowLayout({
        type: "leaf",
        id: crypto.randomUUID(),
        tabProps: {
          documents: handlers.documents,
          activeDocument: handlers.activeDocument,
          onDocumentChange: handlers.onDocumentChange,
          onDocumentContentChange: handlers.onDocumentContentChange,
          onDocumentClose: handlers.onDocumentClose,
          markdownEnabled: handlers.markdownEnabled
        }
      });
    }
  }, [windowLayout]);

  const handleSplitContainer = useCallback((targetLayout: NonNullable<WindowLayout>, direction: 'horizontal' | 'vertical', windowId: string) => {
    // ... existing split handler code ...
  }, []);

  const handleCloseContainer = useCallback((targetLayout: NonNullable<WindowLayout>) => {
    // ... existing close handler code ...
  }, []);

  return {
    windowLayout,
    setWindowLayout,
    createNewSplit,
    handleSplitContainer,
    handleCloseContainer
  };
} 