import { useCallback, useState } from 'react';

export function useDocumentTabs() {
  const [documents, setDocuments] = useState<Array<{ id: string; title: string; content: string }>>([]);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [markdownEnabled, setMarkdownEnabled] = useState(true);

  const handleCloseDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (activeDocument === id) {
      const remaining = documents.filter(doc => doc.id !== id);
      setActiveDocument(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [activeDocument, documents]);

  const createNewDocument = useCallback(() => {
    const newDoc = {
      id: crypto.randomUUID(),
      title: "Untitled",
      content: ""
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocument(newDoc.id);
    
    return newDoc;
  }, []);

  return { 
    documents,
    activeDocument,
    markdownEnabled,
    setMarkdownEnabled,
    createNewDocument,
    handleCloseDocument,
    setActiveDocument,
    setDocuments
  };
} 