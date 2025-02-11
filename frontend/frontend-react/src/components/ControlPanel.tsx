import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';

interface ControlPanelProps {
  width: number;
}

export function ControlPanel({ width }: ControlPanelProps) {
  return (
    <Card className="shadow-md rounded-2xl mx-1 my-2" style={{ width }}>
      <CardHeader>
        <CardTitle>Control Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Button variant="outline">Command 1</Button>
          <Button variant="outline">Command 2</Button>
          <Button variant="outline">Command 3</Button>
        </div>
      </CardContent>
    </Card>
  );
} 