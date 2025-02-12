import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import ReactMarkdown from 'react-markdown';

interface TabbedWindowProps {
  documents: Array<{ id: string; title: string; content: string }>;
  activeDocument: string | null;
  onDocumentChange: (id: string) => void;
  onDocumentClose: (id: string) => void;
}

export function TabbedWindow({ 
  documents, 
  activeDocument, 
  onDocumentChange, 
  onDocumentClose 
}: TabbedWindowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl bg-white shadow-md flex flex-col mx-1 my-2 flex-grow"
    >
      <Tabs value={activeDocument || ''} onValueChange={onDocumentChange}>
        <TabsList className="bg-gray-100">
          {documents.map(doc => (
            <TabsTrigger key={doc.id} value={doc.id} className="relative group">
              {doc.title}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDocumentClose(doc.id);
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </TabsTrigger>
          ))}
        </TabsList>
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