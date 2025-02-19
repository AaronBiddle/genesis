import { useState } from 'react';
import { useFileList } from '../hooks/useFileList';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FileDialog } from './ui/FileDialog';
import { API_ENDPOINTS } from '../config/constants';
import { MaterialIcons, FontAwesomeIcons } from './icons';
import { TOOLBAR_HEIGHT, TOOLBAR_PADDING, TOOLBAR_BUTTON_SIZE } from '../styles/ui-constants';
import { TabbedWindow } from './TabbedWindow';
import { DocumentWorkspace } from './DocumentWorkspace';
import { WindowLayout } from '../types/WindowLayout';

interface DocumentSectionProps {
  documents: Array<{ id: string; title: string; content: string }>;
  activeDocument: string | null;
  onDocumentChange: (id: string) => void;
  onDocumentContentChange: (id: string, content: string) => void;
  onDocumentClose: (id: string) => void;
  onDocumentSave: () => void;
  markdownEnabled: boolean;
  onMarkdownToggle: () => void;
  onNewDocument: () => void;
  onNewSplitDocument: () => void;
  onOpenDocument: (filename: string) => void;
  width: string;
  windowLayout: WindowLayout;
  setWindowLayout: (layout: WindowLayout | ((prev: WindowLayout) => WindowLayout)) => void;
}

export function DocumentSection({ 
  documents, 
  activeDocument, 
  onDocumentChange, 
  onDocumentContentChange,
  onDocumentClose,
  onDocumentSave,
  markdownEnabled,
  onMarkdownToggle,
  onNewDocument,
  onNewSplitDocument,
  onOpenDocument,
  width,
  windowLayout,
  setWindowLayout
}: DocumentSectionProps) {
  const { refreshFiles } = useFileList('document');
  const [isSaving, setIsSaving] = useState(false);
  const [fileDialog, setFileDialog] = useState<{
    visible: boolean;
    mode: 'open' | 'save' | null;
  }>({
    visible: false,
    mode: null
  });

  const handleSaveDocument = async () => {
    const currentDoc = documents.find(doc => doc.id === activeDocument);
    if (!currentDoc) return;

    if (currentDoc.title === "Untitled") {
      setFileDialog({
        visible: true,
        mode: 'save'
      });
    } else {
      try {
        setIsSaving(true);
        await onDocumentSave();
        await refreshFiles();
      } catch (error) {
        console.error('Failed to save document:', error);
        alert('Failed to save document');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleLoadDocument = () => {
    setFileDialog({
      visible: true,
      mode: 'open'
    });
  };

  const handleDeleteDocument = async () => {
    const currentDoc = documents.find(doc => doc.id === activeDocument);
    if (!currentDoc || currentDoc.title === "Untitled") return;

    const confirmed = window.confirm(`Are you sure you want to delete "${currentDoc.title}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.DELETE_DOCUMENT}/${encodeURIComponent(currentDoc.title)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete document');

      onDocumentClose(currentDoc.id);
      await refreshFiles();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const handleContentChange = (id: string, content: string) => {
    const updatedDocs = documents.map(doc => 
      doc.id === id ? { ...doc, content } : doc
    );
    onDocumentContentChange(id, content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ width }}
      className="rounded-2xl bg-white shadow-md flex flex-col mx-1 my-2 flex-grow"
    >
      <div className={`flex justify-between items-center border-b ${TOOLBAR_HEIGHT} ${TOOLBAR_PADDING}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewDocument}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600"
            title="New document"
          >
            <MaterialIcons.NoteAdd style={{ fontSize: '1.25rem' }} />
          </button>
          <button
            onClick={onNewSplitDocument}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-red-600"
            title="New split document (experimental)"
          >
            <MaterialIcons.NoteAdd style={{ fontSize: '1.25rem', color: '#ef4444' }} />
          </button>
          <button
            onClick={handleLoadDocument}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600"
            title="Load document"
          >
            <FontAwesomeIcon icon={FontAwesomeIcons.folderOpen} />
          </button>
          <button
            onClick={handleSaveDocument}
            disabled={isSaving || !activeDocument}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600 disabled:text-gray-400"
            title={isSaving ? "Saving..." : "Save document"}
          >
            {isSaving ? 
              <FontAwesomeIcon icon={FontAwesomeIcons.spinner} spin /> : 
              <MaterialIcons.Save style={{ fontSize: '1.25rem' }} />
            }
          </button>
          <button
            onClick={() => setFileDialog({ visible: true, mode: 'save' })}
            disabled={isSaving || !activeDocument}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600 disabled:text-gray-400"
            title={isSaving ? "Saving..." : "Save document as..."}
          >
            <MaterialIcons.SaveAs style={{ fontSize: '1.25rem' }} />
          </button>
          <button
            onClick={handleDeleteDocument}
            disabled={!activeDocument || documents.find(d => d.id === activeDocument)?.title === "Untitled"}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-red-600 disabled:text-gray-400"
            title={!activeDocument || documents.find(d => d.id === activeDocument)?.title === "Untitled" ? 
              "Cannot delete untitled document" : 
              "Delete document"}
          >
            ✕
          </button>
          <button
            onClick={onMarkdownToggle}
            className={`${TOOLBAR_BUTTON_SIZE} flex items-center justify-center text-black hover:text-blue-600 ${markdownEnabled ? 'text-green-600' : ''}`}
            title={markdownEnabled ? "Markdown View" : "Plain Text View"}
          >
            <FontAwesomeIcon 
              icon={markdownEnabled ? FontAwesomeIcons.fileCode : FontAwesomeIcons.fileAlt} 
              className="h-4 w-4"
            />
          </button>
        </div>
      </div>

      <DocumentWorkspace 
        windowLayout={windowLayout}
        setWindowLayout={setWindowLayout}
        documents={documents}
        activeDocument={activeDocument}
        onDocumentChange={onDocumentChange}
        onDocumentContentChange={onDocumentContentChange}
        onDocumentClose={onDocumentClose}
        markdownEnabled={markdownEnabled}
      />

      {/* <TabbedWindow
        documents={documents}
        activeDocument={activeDocument}
        onDocumentChange={onDocumentChange}
        onDocumentContentChange={handleContentChange}
        onDocumentClose={onDocumentClose}
        markdownEnabled={markdownEnabled}
      /> */}

      {fileDialog.visible && fileDialog.mode && (
        <FileDialog
          mode={fileDialog.mode}
          type="document"
          defaultFilename={fileDialog.mode === 'save' && activeDocument ? 
            documents.find(d => d.id === activeDocument)?.title || '' : 
            ''}
          onSelect={(filename) => {
            setFileDialog({ visible: false, mode: null });
            if (fileDialog.mode === 'open') {
              onOpenDocument(filename);
            } else if (fileDialog.mode === 'save') {
              const currentDoc = documents.find(d => d.id === activeDocument);
              if (currentDoc) {
                currentDoc.title = filename;
                handleSaveDocument();
              }
            }
          }}
          onCancel={() => {
            setFileDialog({ visible: false, mode: null });
          }}
        />
      )}
    </motion.div>
  );
}