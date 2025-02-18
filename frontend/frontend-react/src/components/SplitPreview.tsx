import { useState, useCallback } from 'react';
import { SplitContainer } from './SplitContainer';
import { WindowLayout } from '../types/layout';
import { v4 as uuidv4 } from 'uuid';

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

  return (
    <div className="flex-1 w-full">
      <SplitContainer 
        layout={layout}
        onSplit={handleSplitContainer}
      />
    </div>
  );
} 