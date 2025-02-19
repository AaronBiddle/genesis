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

  const splitPane = useCallback((currentLayout: WindowLayout, direction: 'horizontal' | 'vertical'): WindowLayout => {
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

  const handleSplitContainer = useCallback((targetLayout: WindowLayout, direction: 'horizontal' | 'vertical') => {
    setLayout(currentLayout => {
      const replaceLayout = (layout: WindowLayout): WindowLayout => {
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

  const handleCloseContainer = useCallback((targetLayout: WindowLayout) => {
    setLayout(currentLayout => {
      const findAndReplace = (layout: WindowLayout): WindowLayout | null => {
        if (layout.type === 'leaf') {
          return layout === targetLayout ? null : layout;
        }
        
        if (layout.type === 'split') {
          const first = findAndReplace(layout.first);
          const second = findAndReplace(layout.second);
          
          // If we found and removed the target
          if (first === null || second === null) {
            // Return the remaining pane
            return first || second;
          }
          
          // If neither pane was the target, return the split unchanged
          return {
            ...layout,
            first,
            second,
          };
        }
        
        return layout;
      };
      
      const result = findAndReplace(currentLayout);
      // If we somehow removed the last pane, create a new empty one
      return result || {
        type: "leaf",
        tabProps: createInitialTabProps()
      };
    });
  }, []);

  return (
    <div className={`flex-1 w-full ${WINDOW_CONTAINER_PADDING}`}>
      <SplitContainer 
        layout={layout}
        onSplit={handleSplitContainer}
        onClose={handleCloseContainer}
      />
    </div>
  );
} 