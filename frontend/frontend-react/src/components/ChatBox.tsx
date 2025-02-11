import { useState } from 'react';
import { Card, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAIChat } from '../hooks/useAIChat';
import { MessageContainer } from './MessageContainer';

export function ChatBox({ width }: { width: number }) {
  const { messages, isConnected, sendPrompt, removeMessage } = useAIChat();
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant. Your personality is like Data from Star Trek, but not roleplaying. Be direct, reasonable, and engaged."
  );
  const [messageInput, setMessageInput] = useState('');

  return (
    <Card className="shadow-md rounded-2xl mx-1 my-2 flex flex-col" style={{ width }}>
      <CardHeader className="flex items-center">
        <div className="flex items-center gap-2">
          <CardTitle>Chat</CardTitle>
          <span
            className={`ml-2 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
        <div className="flex-grow" />
        <button
          onClick={() => setShowChatSettings(!showChatSettings)}
          className="p-1 hover:bg-gray-100 rounded-lg"
        >
          ⚙️
        </button>
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
              sendPrompt(messageInput, systemPrompt, temperature);
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
                    sendPrompt(messageInput, systemPrompt, temperature);
                    setMessageInput('');
                  }
                }
              }}
            />
            <Button 
              type="submit"
              onClick={() => {
                if (messageInput.trim()) {
                  sendPrompt(messageInput, systemPrompt, temperature);
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