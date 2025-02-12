import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faFileAlt, faFileCode } from '@fortawesome/free-solid-svg-icons';
import { Button } from './ui/button';

interface TabbedWindowProps {
  documents: Array<{ id: string; title: string; content: string }>;
  activeDocument: string | null;
  onDocumentChange: (id: string) => void;
  onDocumentClose: (id: string) => void;
  onDocumentSave: () => void;
  markdownEnabled: boolean;
  onMarkdownToggle: () => void;
}

export function TabbedWindow({ 
  documents, 
  activeDocument, 
  onDocumentChange, 
  onDocumentClose,
  onDocumentSave,
  markdownEnabled,
  onMarkdownToggle
}: TabbedWindowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl bg-white shadow-md flex flex-col mx-1 my-2 flex-grow"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onMarkdownToggle}
            className={`p-2 ${markdownEnabled ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <FontAwesomeIcon 
              icon={markdownEnabled ? faFileCode : faFileAlt} 
              className="h-4 w-4"
            />
          </Button>
          <Button
            variant="outline"
            onClick={onDocumentSave}
            className="p-2"
          >
            <FontAwesomeIcon icon={faSave} className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Tabs
        value={activeDocument || ''}
        onValueChange={onDocumentChange}
        className="flex-1 flex flex-col"
      >
        <TabsList>
          {documents.map(doc => (
            <TabsTrigger
              key={doc.id}
              value={doc.id}
              onClose={() => onDocumentClose(doc.id)}
            >
              {doc.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {documents.map(doc => (
          <TabsContent
            key={doc.id}
            value={doc.id}
            className="flex-1 relative"
          >
            <ReactMarkdown>{doc.content}</ReactMarkdown>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}