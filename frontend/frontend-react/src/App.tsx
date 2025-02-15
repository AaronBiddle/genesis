import { useState } from 'react'
import { ResizableDivider } from './components/ui/resizable'
import { ControlPanel } from './components/ControlPanel'
import { TabbedWindow } from './components/TabbedWindow'
import { ChatBox } from './components/ChatBox'
import './App.css'
import { API_ENDPOINTS } from './config/constants'

interface Document {
  id: string;
  title: string;
  content: string;
}

export default function App() {
  const [leftWidth, setLeftWidth] = useState(200);
  const [rightWidth, setRightWidth] = useState(600);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [markdownEnabled, setMarkdownEnabled] = useState(true);

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 1000;

  const handleLeftResize = (delta: number) => {
    setLeftWidth((prevWidth) => {
      const newWidth = prevWidth + delta;
      return Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
    });
  };

  const handleRightResize = (delta: number) => {
    setRightWidth((prevWidth) => {
      const newWidth = prevWidth - delta;
      return Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
    });
  };

  const handleNewDocument = () => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: "Untitled",
      content: ""
    };
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocument(newDoc.id);
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
        id: `doc-${Date.now()}`,
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

  const handleCloseDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (activeDocument === id) {
      const remaining = documents.filter(doc => doc.id !== id);
      setActiveDocument(remaining.length > 0 ? remaining[0].id : null);
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

  return (
    <div className="h-screen flex bg-gray-300 text-gray-900 pt-2 pb-2">
      <ControlPanel width={leftWidth} />
      <ResizableDivider onResize={handleLeftResize} className="my-4" />
      <TabbedWindow 
        documents={documents}
        activeDocument={activeDocument}
        onDocumentChange={setActiveDocument}
        onDocumentClose={handleCloseDocument}
        onDocumentSave={handleSaveDocument}
        markdownEnabled={markdownEnabled}
        onMarkdownToggle={() => setMarkdownEnabled(!markdownEnabled)}
        onNewDocument={handleNewDocument}
        onOpenDocument={handleOpenDocument}
      />
      <ResizableDivider onResize={handleRightResize} className="my-4" />
      <ChatBox width={rightWidth} />
    </div>
  );
}
