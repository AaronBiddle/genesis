import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { useLoggingStore, LogLevel } from '../stores/loggingStore';

export function ControlPanel({ width }: { width: number }) {
  const { level, setLevel } = useLoggingStore();

  return (
    <Card className="shadow-md rounded-2xl mx-1 my-2" style={{ width }}>
      <CardHeader>
        <CardTitle>Control Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Log Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full p-2 border rounded-lg bg-white"
            >
              {Object.entries(LogLevel)
                .filter(([key]) => isNaN(Number(key))) // Only show string keys
                .map(([key, value]) => (
                  <option key={key} value={value}>
                    {key}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 