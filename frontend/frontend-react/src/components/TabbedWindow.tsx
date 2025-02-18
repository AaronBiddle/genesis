import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import ReactMarkdown from 'react-markdown';

interface TabbedWindowProps {
  documents: Array<{ id: string; title: string; content: string }>;
  activeDocument: string | null;
  onDocumentChange: (id: string) => void;
  onDocumentContentChange: (id: string, content: string) => void;
  onDocumentClose: (id: string) => void;
  markdownEnabled: boolean;
}

export function TabbedWindow({
  documents,
  activeDocument,
  onDocumentChange,
  onDocumentContentChange,
  onDocumentClose,
  markdownEnabled,
}: TabbedWindowProps) {
  return (
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
                onChange={(e) => onDocumentContentChange(doc.id, e.target.value)}
                className="w-full h-full min-h-[500px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your document content here..."
              />
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}