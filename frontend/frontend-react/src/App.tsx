import { useState } from 'react'
import { ResizableDivider } from './components/ui/resizable'
import { ControlPanel } from './components/ControlPanel'
import { TabbedWindow } from './components/TabbedWindow'
import { ChatBox } from './components/ChatBox'
import './App.css'

interface Document {
  id: string;
  title: string;
  content: string;
}

export default function App() {
  const [leftWidth, setLeftWidth] = useState(200);
  const [rightWidth, setRightWidth] = useState(400);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);

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

  const handleOpenDocument = (title: string, content: string) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title,
      content
    };
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocument(newDoc.id);
  };

  const handleCloseDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (activeDocument === id) {
      const remaining = documents.filter(doc => doc.id !== id);
      setActiveDocument(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  return (
    <div className="h-screen flex bg-gray-300 text-gray-900 pt-2 pb-2">
      <ControlPanel width={leftWidth} onOpenDocument={handleOpenDocument} />
      <ResizableDivider onResize={handleLeftResize} className="my-4" />
      <TabbedWindow 
        documents={documents}
        activeDocument={activeDocument}
        onDocumentChange={setActiveDocument}
        onDocumentClose={handleCloseDocument}
      />
      <ResizableDivider onResize={handleRightResize} className="my-4" />
      <ChatBox width={rightWidth} />
    </div>
  )
}
