import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faXmark } from '@fortawesome/free-solid-svg-icons';

interface TabbedWindowProps {
  documents: Array<{ id: string; title: string; content: string }>;
  activeDocument: string | null;
  onDocumentChange: (id: string) => void;
  onDocumentClose: (id: string) => void;
  onDocumentSave?: () => void;
}

export function TabbedWindow({ 
  documents, 
  activeDocument, 
  onDocumentChange, 
  onDocumentClose,
  onDocumentSave 
}: TabbedWindowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl bg-white shadow-md flex flex-col mx-1 my-2 flex-grow"
    >
      <Tabs value={activeDocument || ''} onValueChange={onDocumentChange}>
        <div className="flex items-center justify-between bg-gray-100 rounded-t-2xl pr-2">
          <TabsList className="bg-transparent flex-grow">
            {documents.map(doc => (
              <TabsTrigger key={doc.id} value={doc.id}>
                {doc.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {documents.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={onDocumentSave}
                className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-800 transition-colors"
                title="Save document"
              >
                <FontAwesomeIcon icon={faSave} />
              </button>
              <button
                onClick={() => activeDocument && onDocumentClose(activeDocument)}
                className="p-2 hover:bg-red-100 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                title="Close document"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}
        </div>
        {documents.map(doc => (
          <TabsContent key={doc.id} value={doc.id} className="p-4 markdown-content">
            <ReactMarkdown>{doc.content}</ReactMarkdown>
          </TabsContent>
        ))}
        {documents.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No documents open
          </div>
        )}
      </Tabs>
    </motion.div>
  );
}