import React, { useState, useEffect, useCallback } from 'react'
import { ResizableDivider } from './components/ui/resizable'
import { ControlPanel } from './components/ControlPanel'
import { DocumentSection } from './components/DocumentSection'
import { ChatBox } from './components/ChatBox'
import { useDocumentTabs } from './hooks/useDocumentTabs'
import './App.css'
import { API_ENDPOINTS } from './config/constants'
import { 
  CONTROL_PANEL_MIN_WIDTH,
  CONTROL_PANEL_MAX_WIDTH,
  CONTROL_PANEL_DEFAULT_WIDTH,
  CHAT_PANEL_MIN_WIDTH,
  CHAT_PANEL_MAX_WIDTH,
  CHAT_PANEL_DEFAULT_WIDTH
} from './components/ui/ui-constants';
import { WindowLayout } from './types/WindowLayout';
import { TabbedWindowProps } from './components/TabbedWindow';
import { useWindowLayout } from './hooks/useWindowLayout';

interface Document {
  id: string;
  title: string;
  content: string;
}

export default function App() {
  const [leftWidth, setLeftWidth] = useState<number>(CONTROL_PANEL_DEFAULT_WIDTH);
  const [rightWidth, setRightWidth] = useState<number>(CHAT_PANEL_DEFAULT_WIDTH);
  
  const { windowLayout, setWindowLayout, createNewSplit } = useWindowLayout();
  
  const { 
    documents, 
    activeDocument, 
    markdownEnabled, 
    setMarkdownEnabled,
    createNewDocument,
    handleCloseDocument,
    setActiveDocument,
    setDocuments,
    handleDocumentContentChange
  } = useDocumentTabs();

  // Update window layout when documents change
  useEffect(() => {
    console.log('App - Documents changed:', documents);
    setWindowLayout(current => {
      // Only create initial layout if we have documents
      if (!current && documents.length > 0) {
        console.log('Creating initial layout with documents:', documents);
        return {
          type: 'leaf',
          id: crypto.randomUUID(),
          tabProps: {
            documents,
            activeDocument,
            onDocumentChange: setActiveDocument,
            onDocumentContentChange: handleDocumentContentChange,
            onDocumentClose: handleCloseDocument,
            markdownEnabled
          }
        };
      }
      
      // Update existing layout with new documents
      if (current) {
        const updateLayoutDocs = (layout: WindowLayout): WindowLayout => {
          if (!layout) return layout;
          
          if (layout.type === 'leaf') {
            return {
              ...layout,
              tabProps: {
                ...layout.tabProps,
                documents: documents
              }
            };
          }
          
          return {
            ...layout,
            first: updateLayoutDocs(layout.first),
            second: updateLayoutDocs(layout.second)
          };
        };
        
        return updateLayoutDocs(current);
      }
      
      return current;
    });
  }, [documents, activeDocument, handleDocumentContentChange, handleCloseDocument, markdownEnabled, setWindowLayout]);

  const handleLeftResize = (delta: number) => {
    setLeftWidth((prevWidth) => {
      const newWidth = prevWidth + delta;
      return Math.min(Math.max(newWidth, CONTROL_PANEL_MIN_WIDTH), CONTROL_PANEL_MAX_WIDTH);
    });
  };

  const handleRightResize = (delta: number) => {
    setRightWidth((prevWidth) => {
      const newWidth = prevWidth - delta;
      return Math.min(Math.max(newWidth, CHAT_PANEL_MIN_WIDTH), CHAT_PANEL_MAX_WIDTH);
    });
  };

  const handleOpenDocument = async (filename: string) => {
    if (!filename) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.LOAD_DOCUMENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      
      if (!response.ok) {
        throw new Error('Failed to load document');
      }
      
      const data = await response.json();
      const newDoc = {
        id: crypto.randomUUID(),
        title: filename,
        content: data.content
      };
      setDocuments(prev => [...prev, newDoc]);
      setActiveDocument(newDoc.id);
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document');
    }
  };

  const handleSaveDocument = async () => {
    if (!activeDocument) return;
    
    const currentDoc = documents.find(doc => doc.id === activeDocument);
    if (!currentDoc) return;

    try {
      const response = await fetch(API_ENDPOINTS.SAVE_DOCUMENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: currentDoc.title,
          content: currentDoc.content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      console.log('Document saved successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document');
    }
  };

  const handleNewSplitDocument = useCallback(() => {
    const { newDoc } = createNewDocument();
    
    // Get the current documents state
    setWindowLayout({
      type: "leaf",
      id: crypto.randomUUID(),
      tabProps: {
        documents,  // Use the documents from state
        activeDocument: newDoc.id,
        onDocumentChange: setActiveDocument,
        onDocumentContentChange: handleDocumentContentChange,
        onDocumentClose: handleCloseDocument,
        markdownEnabled
      }
    });
  }, [
    createNewDocument,
    documents,  // Add documents dependency
    setActiveDocument, 
    handleDocumentContentChange, 
    handleCloseDocument, 
    markdownEnabled
  ]);

  return (
    <div className="h-screen flex bg-gray-300 text-gray-900 pt-2 pb-2">      
      <ControlPanel width={leftWidth} />
      <ResizableDivider onResize={handleLeftResize} />      
      <DocumentSection
        width={`calc(100% - ${leftWidth + 10}px - ${rightWidth}px)`}
        documents={documents}
        setDocuments={setDocuments}
        activeDocument={activeDocument}
        onDocumentChange={setActiveDocument}
        onDocumentContentChange={handleDocumentContentChange}
        onDocumentClose={handleCloseDocument}
        onDocumentSave={handleSaveDocument}
        markdownEnabled={markdownEnabled}
        setMarkdownEnabled={setMarkdownEnabled}
        onNewDocument={createNewDocument}
        onNewSplitDocument={handleNewSplitDocument}
        onOpenDocument={handleOpenDocument}
        windowLayout={windowLayout}
        setWindowLayout={setWindowLayout}
      />
      <ResizableDivider onResize={handleRightResize} />
      <ChatBox width={rightWidth} />      
    </div>
  );
}
