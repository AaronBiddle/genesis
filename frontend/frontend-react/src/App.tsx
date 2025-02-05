import { useState } from 'react';
import Window from './components/Window';
import ChatSidebar from './components/ChatWindow';
import CodeEditor from './components/DocumentWindow';

interface WindowConfig {
  id: string;
  type: 'chat' | 'code';
  title: string;
  content?: string;
}

function App(): JSX.Element {
  const [windows, setWindows] = useState<WindowConfig[]>([]);

  const addWindow = (type: 'chat' | 'code') => {
    const newWindow: WindowConfig = {
      id: Date.now().toString(),
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Window ${windows.length + 1}`
    };
    setWindows([...windows, newWindow]);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(window => window.id !== id));
  };

  return (
    <div className="bg-gray-100 h-screen">
      <div className="p-4 flex gap-2">
        <button 
          onClick={() => addWindow('chat')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Chat Window
        </button>
        <button
          onClick={() => addWindow('code')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Code Window
        </button>
      </div>
      
      <div className="relative w-full h-[calc(100vh-4rem)]">
        {windows.map((window) => (
          <Window
            key={window.id}
            title={window.title}
            type={window.type}
            onClose={() => closeWindow(window.id)}
          >
            {window.type === 'chat' ? (
              <ChatSidebar isWindowed />
            ) : (
              <CodeEditor />
            )}
          </Window>
        ))}
      </div>
    </div>
  );
}

export default App;
