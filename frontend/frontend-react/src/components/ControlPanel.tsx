import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';

interface ControlPanelProps {
  width: number;
  onOpenDocument: (title: string, content: string) => void;
}

export function ControlPanel({ width, onOpenDocument }: ControlPanelProps) {
  const handleOpenClick = async () => {
    const title = prompt('Enter document name:');
    if (title) {
      try {
        const response = await fetch('http://localhost:8000/load_document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: title })
        });
        
        if (!response.ok) {
          throw new Error('Failed to load document');
        }
        
        const data = await response.json();
        onOpenDocument(title, data.content);
      } catch (error) {
        console.error('Error loading document:', error);
        alert('Failed to load document');
      }
    }
  };

  const handleNewDocument = () => {
    onOpenDocument("Untitled", "");
  };

  return (
    <Card className="shadow-md rounded-2xl mx-1 my-2" style={{ width }}>
      <CardHeader>
        <CardTitle>Control Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handleNewDocument}>
            New Document
          </Button>
          <Button variant="outline" onClick={handleOpenClick}>
            Open Document
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 