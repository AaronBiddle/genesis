import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader} from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAIChat } from '../hooks/useAIChat';
import { MessageContainer } from './MessageContainer';
import { useChatSettings } from '../stores/chatSettingsStore';
import { ChatMessage } from '../types/chat';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useFileList } from '../hooks/useFileList';
import { API_ENDPOINTS } from '../config/constants';

export function ChatBox({ width }: { width: number }) {
  const { messages, setMessages, isConnected, sendPrompt, removeMessage, saveChat, loadChat } = useAIChat();
  const { files: availableChats, refreshFiles: refreshChats } = useFileList('chat');
  const { 
    systemPrompt,
    temperature,
    setSystemPrompt,
    setTemperature 
  } = useChatSettings();
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chatTitle, setChatTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialMount = useRef(true);
  const prevMessagesRef = useRef<ChatMessage[]>(messages);
  const prevTitleRef = useRef(chatTitle);

  // Update the isGenerating check to include "waiting for AI response" state
  const isGenerating = messages.length > 0 && (
    // Check if last message is empty assistant message
    (messages[messages.length - 1].role === 'assistant' && 
     messages[messages.length - 1].content === '') ||
    // OR if last message is user message with no AI response yet
    (messages[messages.length - 1].role === 'user')
  );

  // Track message changes for unsaved state
  useEffect(() => {
    if (isInitialMount.current) {
      prevMessagesRef.current = messages;
      prevTitleRef.current = chatTitle;
      isInitialMount.current = false;
      // If starting with empty messages, consider it a new session
      if (messages.length === 0) {
        setHasUnsavedChanges(false);
      }
      return;
    }
    
    // Mark changes if either messages or title have changed
    if (
      JSON.stringify(messages) !== JSON.stringify(prevMessagesRef.current) ||
      chatTitle !== prevTitleRef.current
    ) {
      setHasUnsavedChanges(true);
    }
    prevMessagesRef.current = messages;
    prevTitleRef.current = chatTitle;
  }, [messages, chatTitle]);

  const handleSaveChat = async () => {
    try {
      setIsSaving(true);
      const response = await saveChat(chatTitle);
      setHasUnsavedChanges(false);
      const savedTitle = response.filename || chatTitle;
      setChatTitle(savedTitle);
      await refreshChats();
    } catch (error) {
      console.error('Failed to save chat:', error);
      alert('Failed to save chat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadChat = async (selectedTitle: string) => {
    if (!selectedTitle) return;
    
    try {
      const data = await loadChat(selectedTitle);
      setChatTitle(selectedTitle);
      setHasUnsavedChanges(false);
      
      // Update chat settings if they were saved
      if (data.system_prompt) setSystemPrompt(data.system_prompt);
      if (data.temperature) setTemperature(data.temperature);
    } catch (error) {
      console.error('Failed to load chat:', error);
      alert('Failed to load chat');
    }
  };

  const handleNewChat = () => {
    // Clear messages
    setMessages([]);
    // Reset title
    setChatTitle("untitled chat");
    // Reset to default system prompt and temperature
    setSystemPrompt("You are a helpful assistant...");
    setTemperature(0.7);
    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
  };

  const handleDeleteChat = async () => {
    if (!chatTitle || chatTitle === "untitled chat") return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${chatTitle}"?`);
    if (!confirmed) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.DELETE_CHAT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: chatTitle })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }
      
      setMessages([]);
      setChatTitle("untitled chat");
      setHasUnsavedChanges(false);
      await refreshChats();
      
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat');
    }
  };

  // Add isGenerating to the saveDisabled condition
  const saveDisabled = isSaving || !hasUnsavedChanges || isGenerating;

  // Update buttonIcon to only show spinner or save icon
  const buttonIcon = isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : 
                    <FontAwesomeIcon icon={faSave} />;

  return (
    <Card className="shadow-md rounded-2xl mx-1 my-2 flex flex-col" style={{ width }}>
      <CardHeader className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="w-8 h-8 flex items-center justify-center text-black hover:text-green-600"
            title="New chat"
          >
            <FontAwesomeIcon icon={faFileCirclePlus} />
          </button>
          <select 
            value={chatTitle}
            onChange={(e) => handleLoadChat(e.target.value)}
            className="px-3 py-1 border rounded flex-grow"
          >
            <option value="">Select a chat...</option>
            {availableChats.map(chat => {
              const chatName = chat.replace(/\.json$/, '');
              return (
                <option key={chat} value={chatName}>
                  {chatName}
                </option>
              );
            })}
          </select>
          <button
            onClick={handleSaveChat}
            disabled={saveDisabled}
            className="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 disabled:text-gray-400"
            title={saveDisabled ? 
              (isSaving ? "Saving..." : 
               isGenerating ? "Cannot save while message is generating" :
               "No changes to save") 
              : "Save chat"}
          >
            {buttonIcon}
          </button>
          <button
            onClick={handleDeleteChat}
            disabled={chatTitle === "untitled chat" || isSaving}
            className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 disabled:text-gray-400"
            title={chatTitle === "untitled chat" ? "Cannot delete untitled chat" : "Delete chat"}
          >
            ✕
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