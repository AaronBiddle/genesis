import React, { useState } from 'react';
import { sendMessage, ChatMessage } from '../services/chatService';

interface ChatSidebarProps {
  isWindowed?: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isWindowed = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText,
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send message to backend
      const updatedMessages = [...messages, userMessage];
      const response = await sendMessage(updatedMessages);

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Optionally add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="h-full flex-1 bg-gray-50 p-4 flex flex-col">
      <div className="flex justify-between items-center bg-gray-200 px-2 py-1 rounded-md shadow-sm mb-2">
        <h2 className="text-lg font-bold">Chat</h2>
      </div>
      
      <select className="mb-2 p-2 border rounded-md bg-white" id="chat-selector">
        <option>Recent Chat 1</option>
        <option>Recent Chat 2</option>
        <option>Recent Chat 3</option>
        <option>Recent Chat 4</option>
        <option>Recent Chat 5</option>
        <option>Recent Chat 6</option>
        <option>Recent Chat 7</option>
        <option>Recent Chat 8</option>
        <option>Recent Chat 9</option>
        <option>Recent Chat 10</option>
        <option>Other...</option>
      </select>
      
      <div className="flex-1 overflow-y-auto border p-2 rounded-md bg-white">
        {messages.map((message, index) => (
          <p key={index} className="mb-2">
            <span className={`font-bold ${message.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
              {message.role === 'user' ? 'User:' : 'AI:'}
            </span>{" "}
            <span className="text-gray-700">{message.content}</span>
          </p>
        ))}
        {isLoading && (
          <p className="text-gray-500 italic">AI is typing...</p>
        )}
      </div>
      
      <div className="mt-2 flex flex-col gap-2">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..." 
          className="p-2 border rounded-md w-full" 
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
