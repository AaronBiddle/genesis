import { useCallback, useState } from 'react';
import { useLoggingStore, LogLevel } from '../stores/loggingStore';

export function useDocumentTabs() {
  const log = useLoggingStore(state => state.log);
  const namespace = 'useDocumentTabs:';

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

  const handleDocumentContentChange = useCallback((id: string, content: string) => {
    log(LogLevel.DEBUG, namespace, 'Before content update:', {
      id,
      content,
      currentDocs: documents
    });
    
    setDocuments(prev => {
      const updated = prev.map(doc => 
        doc.id === id ? { ...doc, content } : doc
      );
      log(LogLevel.DEBUG, namespace, 'Documents being updated to:', updated);
      return updated;
    });
  }, [documents]);

  const createNewDocument = useCallback(() => {
    const newDoc = {
      id: crypto.randomUUID(),
      title: "Untitled",
      content: ""
    };
    
    setDocuments(prev => {
      const updatedDocs = [...prev, newDoc];
      log(LogLevel.DEBUG, namespace, 'Documents being updated to:', updatedDocs);
      return updatedDocs;
    });
    
    setActiveDocument(newDoc.id);
    
    return {
      newDoc,
      currentDocuments: [newDoc]
    };
  }, []);

  return { 
    documents,
    activeDocument,
    markdownEnabled,
    setMarkdownEnabled,
    createNewDocument,
    handleCloseDocument,
    setActiveDocument,
    setDocuments,
    handleDocumentContentChange
  };
} 