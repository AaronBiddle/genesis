import { useState, useCallback, useEffect } from 'react';
import { SplitContainer } from './SplitContainer';
import { WindowLayout } from '../types/WindowLayout';
import { v4 as uuidv4 } from 'uuid';
import { WINDOW_CONTAINER_PADDING } from './ui/ui-constants';

const createInitialTabProps = (id: string = "1", title: string = "Initial Window") => ({
  documents: [{
    id,
    title,
    content: "Try splitting this window!"
  }],
  activeDocument: id,
  onDocumentChange: () => {},
  onDocumentContentChange: (id: string, content: string) => {
    console.log('Content changed:', content);
  },
  onDocumentClose: () => {},
  markdownEnabled: false
});

interface DocumentWorkspaceProps {
  windowLayout: WindowLayout;
  setWindowLayout: (layout: WindowLayout | ((prev: WindowLayout) => WindowLayout)) => void;
  documents: Array<{ id: string; title: string; content: string }>;
  activeDocument: string | null;
  onDocumentChange: (id: string) => void;
  onDocumentContentChange: (id: string, content: string) => void;
  onDocumentClose: (id: string) => void;
  markdownEnabled: boolean;
}

export function DocumentWorkspace({ 
  windowLayout, 
  setWindowLayout,
  documents,
  activeDocument,
  onDocumentChange,
  onDocumentContentChange,
  onDocumentClose,
  markdownEnabled
}: DocumentWorkspaceProps) {
  
  useEffect(() => {
    console.log('DocumentWorkspace - Documents changed:', documents);
  }, [documents]);

  const updateLayoutWithCurrentDocs = useCallback((layout: WindowLayout): WindowLayout => {
    if (!layout) return null;
    
    if (layout.type === 'leaf') {
      return {
        ...layout,
        tabProps: {
          ...layout.tabProps,
          documents,
          activeDocument,
          onDocumentChange,
          onDocumentContentChange,
          onDocumentClose,
          markdownEnabled
        }
      };
    }
    
    if (layout.type === 'split') {
      return {
        ...layout,
        first: updateLayoutWithCurrentDocs(layout.first),
        second: updateLayoutWithCurrentDocs(layout.second)
      };
    }
    
    return layout;
  }, [documents, activeDocument, onDocumentChange, onDocumentContentChange, onDocumentClose, markdownEnabled]);

  const handleSplitContainer = useCallback((targetLayout: NonNullable<WindowLayout>, direction: 'horizontal' | 'vertical') => {
    setWindowLayout((currentLayout: WindowLayout): WindowLayout => {
      if (!currentLayout) return null;
      
      const findAndReplace = (layout: WindowLayout): WindowLayout => {
        if (!layout) return null;
        if (layout === targetLayout) {
          return {
            type: 'split',
            direction,
            first: layout,
            second: {
              type: 'leaf',
              tabProps: {
                documents,
                activeDocument,
                onDocumentChange,
                onDocumentContentChange,
                onDocumentClose,
                markdownEnabled
              }
            }
          };
        }
        
        if (layout.type === 'split') {
          return {
            ...layout,
            first: findAndReplace(layout.first),
            second: findAndReplace(layout.second),
          };
        }
        
        return layout;
      };
      
      return findAndReplace(currentLayout);
    });
  }, [documents, activeDocument, onDocumentChange, onDocumentContentChange, onDocumentClose, markdownEnabled]);

  const handleCloseContainer = useCallback((targetLayout: NonNullable<WindowLayout>) => {
    setWindowLayout((currentLayout: WindowLayout): WindowLayout => {
      if (!currentLayout) return null;
      
      const findAndReplace = (layout: WindowLayout): WindowLayout => {
        if (!layout) return null;
        if (layout.type === 'leaf') {
          return layout === targetLayout ? null : layout;
        }
        
        if (layout.type === 'split') {
          const first = findAndReplace(layout.first);
          const second = findAndReplace(layout.second);
          
          if (!first || !second) {
            return first || second;
          }
          
          return {
            ...layout,
            first,
            second,
          };
        }
        
        return layout;
      };
      
      return findAndReplace(currentLayout);
    });
  }, []);

  return (
    <div className={`flex-1 w-full ${WINDOW_CONTAINER_PADDING}`}>
      {windowLayout ? (
        <SplitContainer 
          layout={updateLayoutWithCurrentDocs(windowLayout)}
          onSplit={handleSplitContainer}
          onClose={handleCloseContainer}
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          {/* Empty state - could add a message or leave blank */}
        </div>
      )}
    </div>
  );
} 