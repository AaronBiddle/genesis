import { useCallback, useEffect } from 'react';
import { SplitContainer } from './SplitContainer';
import { WindowLayout } from '../types/WindowLayout';

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

  const handleSplitContainer = useCallback((targetLayout: NonNullable<WindowLayout>, direction: 'horizontal' | 'vertical', windowId: string) => {
    console.log('Starting split operation:', { 
      direction,
      windowId,
      documents,
      targetActiveDoc: targetLayout.type === 'leaf' ? targetLayout.tabProps.activeDocument : null
    });
    
    setWindowLayout((currentLayout: WindowLayout): WindowLayout => {
      if (!currentLayout) return null;
      
      let splitApplied = false;
      
      const findAndReplace = (layout: WindowLayout): WindowLayout => {
        if (!layout) return null;
        
        // For leaf nodes, check if this is the one we want to split
        if (layout.type === 'leaf' && !splitApplied) {
          const isTarget = layout.id === windowId;
          
          if (isTarget) {
            console.log('Splitting layout:', { 
              windowId: layout.id,
              documents,
              currentDocs: layout.tabProps.documents
            });
            splitApplied = true;
            
            return {
              type: 'split' as const,
              direction,
              first: {
                type: 'leaf' as const,
                id: layout.id,
                tabProps: {
                  ...layout.tabProps,
                  documents
                }
              },
              second: {
                type: 'leaf' as const,
                id: crypto.randomUUID(),
                tabProps: {
                  ...layout.tabProps,
                  documents
                }
              }
            };
          }
        }
        
        // For split nodes, try to split their children
        if (layout.type === 'split') {
          const updatedSecond = !splitApplied ? findAndReplace(layout.second) : layout.second;
          const updatedFirst = !splitApplied ? findAndReplace(layout.first) : layout.first;
          
          if (updatedFirst !== layout.first || updatedSecond !== layout.second) {
            return {
              ...layout,
              first: updatedFirst,
              second: updatedSecond
            };
          }
        }
        
        return layout;
      };
      
      const result = findAndReplace(currentLayout);
      console.log('Split result:', {
        splitApplied,
        resultDocs: result?.type === 'leaf' ? result.tabProps.documents : 'split'
      });
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

  return windowLayout ? (
    <div className="h-full">
      <SplitContainer 
        layout={windowLayout}
        onSplit={handleSplitContainer}
        onClose={handleCloseContainer}
      />
    </div>
  ) : null;
} 