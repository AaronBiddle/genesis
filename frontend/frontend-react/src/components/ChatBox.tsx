import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader} from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAIChat } from '../hooks/useAIChat';
import { MessageContainer } from './MessageContainer';
import { useChatSettings } from '../stores/chatSettingsStore';
import { ChatMessage } from '../types/chat';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faCheck, faFolderOpen, faFileCirclePlus } from '@fortawesome/free-solid-svg-icons';

export function ChatBox({ width }: { width: number }) {
  const { messages, setMessages, isConnected, sendPrompt, removeMessage, saveChat, loadChat } = useAIChat();
  const { 
    systemPrompt,
    temperature,
    setSystemPrompt,
    setTemperature 
  } = useChatSettings();
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chatTitle, setChatTitle] = useState("untitled chat");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isInitialMount = useRef(true);
  const prevMessagesRef = useRef<ChatMessage[]>([]);
  const prevTitleRef = useRef(chatTitle);
  const [availableChats, setAvailableChats] = useState<string[]>([]);

  // Update the isGenerating check to include "waiting for AI response" state
  const isGenerating = messages.length > 0 && (
    // Check if last message is empty assistant message
    (messages[messages.length - 1].role === 'assistant' && 
     messages[messages.length - 1].content === '') ||
    // OR if last message is user message with no AI response yet
    (messages[messages.length - 1].role === 'user')
  );

  // Add this condition to check for a fresh/empty session
  const isNewSession = messages.length === 0;

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

  // Add useEffect to fetch available chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('http://localhost:8000/list_chats');
        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }
        const data = await response.json();
        setAvailableChats(data.chats.map((chat: string) => chat.replace(/\.json$/, "")));
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, []);

  const handleSaveChat = async () => {
    try {
      setIsSaving(true);
      const response = await saveChat(chatTitle);
      setHasUnsavedChanges(false);
      const savedTitle = response.saved_path.split('/').pop()?.replace('.json', '') || chatTitle;
      setChatTitle(savedTitle);
      
      // Refresh the available chats list
      const chatsResponse = await fetch('http://localhost:8000/list_chats');
      if (chatsResponse.ok) {
        const data = await chatsResponse.json();
        setAvailableChats(data.chats.map((chat: string) => chat.replace(/\.json$/, "")));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadChat = async () => {
    try {
      const data = await loadChat(chatTitle);
      setSystemPrompt(data.system_prompt);
      setTemperature(data.temperature);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load chat:', error);
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

  // Save button state conditions
  const saveDisabled = isSaving || isGenerating || !hasUnsavedChanges;

  // Remove the SaveIcon SVG component and update the button icon logic
  const buttonIcon = isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : 
                    hasUnsavedChanges ? <FontAwesomeIcon icon={faSave} /> : 
                    isNewSession ? <FontAwesomeIcon icon={faSave} /> : 
                    <FontAwesomeIcon icon={faCheck} />;

  return (
    <Card className="shadow-md rounded-2xl mx-1 my-2 flex flex-col" style={{ width }}>
      <CardHeader className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <input
            list="available-chats"
            value={chatTitle}
            onChange={(e) => setChatTitle(e.target.value)}
            className="w-48 border-none focus:outline-none focus:ring-1 focus:ring-gray-200 rounded px-1 bg-transparent"
            placeholder="Chat name"
          />
          <datalist id="available-chats">
            <option value="untitled chat" />
            {availableChats.map((chat) => (
              <option key={chat} value={chat.replace(/\.json$/, "")} />
            ))}
          </datalist>
          
          <button 
            className="p-1 hover:bg-gray-100 rounded text-gray-700"
            title="New chat"
            onClick={handleNewChat}
          >
            <FontAwesomeIcon icon={faFileCirclePlus} />
          </button>
          <button 
            className={`p-1 rounded transition-colors ${
              saveDisabled ? 'text-gray-200 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-700'
            }`}
            title={
              isNewSession ? 'No messages to save' :
              isGenerating ? 'Cannot save during generation' :
              isSaving ? 'Saving...' :
              hasUnsavedChanges ? 'Save changes' :
              'All changes saved'
            }
            onClick={handleSaveChat}
            disabled={saveDisabled}
          >
            {buttonIcon}
          </button>
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            title="Open chat"
            onClick={handleLoadChat}
          >
            <FontAwesomeIcon icon={faFolderOpen} />
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