import { useState } from 'react';
import { Card, CardHeader} from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAIChat } from '../hooks/useAIChat';
import { MessageContainer } from './MessageContainer';
import { useChatSettings } from '../stores/chatSettingsStore';

export function ChatBox({ width }: { width: number }) {
  const { messages, isConnected, sendPrompt, removeMessage, saveChat, loadChat } = useAIChat();
  const { 
    systemPrompt,
    temperature,
    setSystemPrompt,
    setTemperature 
  } = useChatSettings();
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chatTitle, setChatTitle] = useState("untitled chat");

  const handleSaveChat = async () => {
    try {
      const response = await saveChat(chatTitle);
      console.log('Chat saved:', response.saved_path);
      setChatTitle(response.saved_path.split('/').pop()?.replace('.json', '') || chatTitle);
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  };

  const handleLoadChat = async () => {
    const filename = prompt('Enter chat filename to load:');
    if (filename) {
      try {
        const data = await loadChat(filename);
        setChatTitle(filename);
        setSystemPrompt(data.system_prompt);
        setTemperature(data.temperature);
      } catch (error) {
        console.error('Failed to load chat:', error);
      }
    }
  };

  return (
    <Card className="shadow-md rounded-2xl mx-1 my-2 flex flex-col" style={{ width }}>
      <CardHeader className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatTitle}
            className="w-48 border-none focus:outline-none focus:ring-1 focus:ring-gray-200 rounded px-1 bg-transparent"
            onChange={(e) => setChatTitle(e.target.value)}
            placeholder="Chat name"
          />
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            title="Save chat"
            onClick={handleSaveChat}
          >
            💾
          </button>  
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            title="Open chat"
            onClick={handleLoadChat}
          >
            📂
          </button>                  
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <button onClick={() => setShowChatSettings(!showChatSettings)}>⚙️</button>
        </div>
      </CardHeader>
      <div className="flex-grow overflow-auto p-4">
        {showChatSettings ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">System Prompt</label>
              <Input
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                minHeight={300}
                maxHeight={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageContainer
              key={index}
              message={message}
              index={index}
              onRemove={removeMessage}
            />
          ))
        )}
      </div>
      <div className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (messageInput.trim()) {
              sendPrompt(messageInput);
              setMessageInput('');
            }
          }}
        >
          <div className="flex gap-2">
            <Input
              name="message"
              placeholder="Type your message..."
              className="flex-grow"
              minHeight={100}
              maxHeight={200}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (messageInput.trim()) {
                    sendPrompt(messageInput);
                    setMessageInput('');
                  }
                }
              }}
            />
            <Button 
              type="submit"
              onClick={() => {
                if (messageInput.trim()) {
                  sendPrompt(messageInput);
                  setMessageInput('');
                }
              }}
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
} 