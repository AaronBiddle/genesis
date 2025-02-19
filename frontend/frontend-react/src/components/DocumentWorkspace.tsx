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
  setDocuments: (docs: Array<{ id: string; title: string; content: string }> | ((prev: Array<{ id: string; title: string; content: string }>) => Array<{ id: string; title: string; content: string }>)) => void;
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
  setDocuments,
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

  // Add this logging helper
  const logLayout = (layout: WindowLayout, prefix = '') => {
    if (!layout) {
      console.log(prefix + 'null layout');
      return;
    }
    
    if (layout.type === 'leaf') {
      console.log(prefix + 'LEAF:', {
        documents: layout.tabProps.documents.map(d => d.id),
        activeDocument: layout.tabProps.activeDocument
      });
    } else if (layout.type === 'split') {
      console.log(prefix + 'SPLIT:', { direction: layout.direction });
      console.log(prefix + 'First:');
      logLayout(layout.first, prefix + '  ');
      console.log(prefix + 'Second:');
      logLayout(layout.second, prefix + '  ');
    }
  };

  const handleSplitContainer = useCallback((targetLayout: NonNullable<WindowLayout>, direction: 'horizontal' | 'vertical') => {
    console.log('DocumentWorkspace - Split container:', { direction, documents });
    
    setWindowLayout((currentLayout: WindowLayout): WindowLayout => {
      if (!currentLayout) return null;
      
      console.log('Current Layout Structure:');
      logLayout(currentLayout);
      
      const findAndReplace = (layout: WindowLayout): WindowLayout => {
        if (!layout) return null;
        
        // Type guard to check if layouts are leaf nodes
        const isLeafLayout = (l: WindowLayout): l is { type: 'leaf'; tabProps: any } => 
          l?.type === 'leaf';
        
        // Compare layout properties with type checking
        const isTargetLayout = 
          isLeafLayout(layout) && 
          isLeafLayout(targetLayout) &&
          layout.tabProps.activeDocument === targetLayout.tabProps.activeDocument;
        
        if (isTargetLayout) {
          console.log('Found target layout to split');
          const newLayout = {
            type: 'split' as const,
            direction,
            first: {
              type: 'leaf' as const,
              tabProps: { ...layout.tabProps }
            },
            second: {
              type: 'leaf' as const,
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
          console.log('New Layout Structure:');
          logLayout(newLayout);
          return newLayout;
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
      
      const result = findAndReplace(currentLayout);
      console.log('Final Layout Structure:');
      logLayout(result);
      return result;
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