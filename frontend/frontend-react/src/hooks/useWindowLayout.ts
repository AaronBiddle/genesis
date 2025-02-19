import { useState, useCallback } from 'react';
import { WindowLayout } from '../types/WindowLayout';

export function useWindowLayout() {
  const [windowLayout, setWindowLayout] = useState<WindowLayout>(null);

  const createNewSplit = useCallback(() => {
    if (!windowLayout) {
      setWindowLayout({
        type: "leaf",
        tabProps: {
          documents: [],
          activeDocument: null,
          onDocumentChange: () => {},
          onDocumentContentChange: () => {},
          onDocumentClose: () => {},
          markdownEnabled: false
        }
      });
    }
  }, [windowLayout]);

  return {
    windowLayout,
    setWindowLayout,
    createNewSplit
  };
} 