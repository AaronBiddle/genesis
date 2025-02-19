import { useState, useCallback } from 'react';
import { SplitContainer } from './SplitContainer';
import { WindowLayout } from '../types/layout';
import { v4 as uuidv4 } from 'uuid';
import { WINDOW_CONTAINER_PADDING } from '../styles/ui-constants';

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

export function SplitPreview() {
  const [layout, setLayout] = useState<WindowLayout>({
    type: "leaf",
    tabProps: createInitialTabProps()
  });

  const splitPane = useCallback((currentLayout: NonNullable<WindowLayout>, direction: 'horizontal' | 'vertical'): WindowLayout => {
    const newId = uuidv4();
    return {
      type: 'split',
      direction,
      first: currentLayout,
      second: {
        type: 'leaf',
        tabProps: createInitialTabProps(newId, "New Window")
      }
    };
  }, []);

  const handleSplitContainer = useCallback((targetLayout: NonNullable<WindowLayout>, direction: 'horizontal' | 'vertical') => {
    setLayout(currentLayout => {
      if (!currentLayout) return currentLayout;

      const replaceLayout = (layout: WindowLayout): WindowLayout => {
        if (!layout) return layout;
        if (layout === targetLayout) {
          return splitPane(layout, direction);
        }
        if (layout.type === 'split') {
          return {
            ...layout,
            first: replaceLayout(layout.first),
            second: replaceLayout(layout.second),
          };
        }
        return layout;
      };
      
      return replaceLayout(currentLayout);
    });
  }, [splitPane]);

  const handleCloseContainer = useCallback((targetLayout: NonNullable<WindowLayout>) => {
    setLayout(currentLayout => {
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

  const createNewSplit = useCallback(() => {
    if (!layout) {
      setLayout({
        type: "leaf",
        tabProps: createInitialTabProps()
      });
    }
  }, [layout]);

  return (
    <div className={`flex-1 w-full ${WINDOW_CONTAINER_PADDING}`}>
      {layout ? (
        <SplitContainer 
          layout={layout}
          onSplit={handleSplitContainer}
          onClose={handleCloseContainer}
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <button 
            onClick={createNewSplit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create New Split
          </button>
        </div>
      )}
    </div>
  );
} 