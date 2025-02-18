import { useState } from 'react';
import { useFileList } from '../hooks/useFileList';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileCode, 
  faFileAlt, 
  faSpinner,
  faFolderOpen
} from '@fortawesome/free-solid-svg-icons';
import { FileDialog } from './ui/FileDialog';
import { API_ENDPOINTS } from '../config/constants';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { TOOLBAR_HEIGHT, TOOLBAR_PADDING, TOOLBAR_BUTTON_SIZE } from '../styles/ui-constants';
interface TabbedWindowProps {
  documents: Array<{ id: string; title: string; content: string }>;
  activeDocument: string | null;
  onDocumentChange: (id: string) => void;
  onDocumentContentChange: (id: string, documents: Array<{ id: string; title: string; content: string }>) => void;
  onDocumentClose: (id: string) => void;
  onDocumentSave: () => void;
  markdownEnabled: boolean;
  onMarkdownToggle: () => void;
  onNewDocument: () => void;
  onOpenDocument: (filename: string) => void;
  width: string;
}

export function TabbedWindow({ 
  documents, 
  activeDocument, 
  onDocumentChange, 
  onDocumentContentChange,
  onDocumentClose,
  onDocumentSave,
  markdownEnabled,
  onMarkdownToggle,
  onNewDocument,
  onOpenDocument,
  width
}: TabbedWindowProps) {
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

  const handleContentChange = (content: string) => {
    if (!activeDocument) return;
    const updatedDocs = documents.map(doc => 
      doc.id === activeDocument ? { ...doc, content } : doc
    );
    onDocumentContentChange(activeDocument, updatedDocs);
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
            <NoteAddIcon style={{ fontSize: '1.25rem' }} />
          </button>
          <button
            onClick={handleLoadDocument}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600"
            title="Load document"
          >
            <FontAwesomeIcon icon={faFolderOpen} />
          </button>
          <button
            onClick={handleSaveDocument}
            disabled={isSaving || !activeDocument}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600 disabled:text-gray-400"
            title={isSaving ? "Saving..." : "Save document"}
          >
            {isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : <SaveIcon style={{ fontSize: '1.25rem' }} />}
          </button>
          <button
            onClick={() => setFileDialog({ visible: true, mode: 'save' })}
            disabled={isSaving || !activeDocument}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600 disabled:text-gray-400"
            title={isSaving ? "Saving..." : "Save document as..."}
          >
            <SaveAsIcon style={{ fontSize: '1.25rem' }} />
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
              icon={markdownEnabled ? faFileCode : faFileAlt} 
              className="h-4 w-4"
            />
          </button>
        </div>
      </div>
      <Tabs
        value={activeDocument || ''}
        onValueChange={onDocumentChange}
        className="flex-1 flex flex-col"
      >
        <TabsList className="border-b px-4">
          {documents.map(doc => (
            <TabsTrigger
              key={doc.id}
              value={doc.id}
              onClose={() => onDocumentClose(doc.id)}
              className="data-[state=active]:bg-blue-100 data-[state=active]:shadow data-[state=active]:shadow-blue-300 data-[state=active]:border-b data-[state=active]:border-b-blue-100 data-[state=active]:-mb-px rounded-t-lg transition-all duration-200"
            >
              {doc.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {documents.map(doc => (
          <TabsContent 
            key={doc.id} 
            value={doc.id}
            className="flex-1 p-4 overflow-auto w-full"
          >
            <div className="relative w-full h-full">
              {markdownEnabled ? (
                <div className="prose max-w-none markdown-content absolute inset-0 overflow-auto">
                  <ReactMarkdown
                    components={{
                      p: ({ children, ...props }) => (
                        <p className="whitespace-pre-line" {...props}>
                          {children}
                        </p>
                      )
                    }}
                  >
                    {doc.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={doc.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full h-full min-h-[500px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your document content here..."
                />
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

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