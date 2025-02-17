import { useState } from 'react';
import { Card, CardHeader} from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAIChat } from '../hooks/useAIChat';
import { MessageContainer } from './MessageContainer';
import { useChatSettings } from '../stores/chatSettingsStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { useFileList } from '../hooks/useFileList';
import { API_ENDPOINTS } from '../config/constants';
import { FileDialog } from './ui/FileDialog';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { 
  TOOLBAR_HEIGHT, 
  TOOLBAR_PADDING, 
} from '../styles/ui-constants';

export function ChatBox({ width }: { width: number }) {
  const { 
    messages, 
    setMessages, 
    isConnected, 
    isStreaming,
    sendPrompt, 
    removeMessage, 
    saveChat, 
    loadChat 
  } = useAIChat();
  const { refreshFiles: refreshChats } = useFileList('chat');
  const { 
    systemPrompt,
    temperature,
    setSystemPrompt,
    setTemperature 
  } = useChatSettings();
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chatTitle, setChatTitle] = useState("untitled chat");
  const [isSaving, setIsSaving] = useState(false);
  const [fileDialog, setFileDialog] = useState<{
    visible: boolean;
    mode: 'open' | 'save' | null;
  }>({
    visible: false,
    mode: null
  });

  const doSaveChat = async (filename: string) => {
    try {
      setIsSaving(true);
      const response = await saveChat(filename);
      const savedTitle = response.filename || filename;
      setChatTitle(savedTitle);
      await refreshChats();
    } catch (error) {
      console.error('Failed to save chat:', error);
      alert('Failed to save chat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChat = async () => {
    if (chatTitle === "untitled chat") {
      setFileDialog({
        visible: true,
        mode: 'save'
      });
    } else {
      await doSaveChat(chatTitle);
    }
  };

  const handleLoadChat = async () => {
    setFileDialog({
      visible: true,
      mode: 'open'
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatTitle("untitled chat");
    setSystemPrompt("You are a helpful assistant...");
    setTemperature(0.7);
  };

  return (
    <>
      <Card 
        className="shadow-md rounded-2xl mx-1 my-2 flex flex-col" 
        style={{ width }}
      >
        <CardHeader className={`flex items-center justify-between border-b ${TOOLBAR_HEIGHT} ${TOOLBAR_PADDING}`}>
          <div>
            <span className="text-xl font-semibold">{chatTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600"
              title="New chat"
            >
              <NoteAddIcon style={{ fontSize: '1.25rem' }} />
            </button>
            <button
              onClick={handleLoadChat}
              className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600"
              title="Load chat"
            >
              <FontAwesomeIcon icon={faFolderOpen} />
            </button>
            <button
              onClick={handleSaveChat}
              disabled={isSaving || isStreaming}
              className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600 disabled:text-gray-400"
              title={
                isSaving
                  ? "Saving…"
                  : isStreaming
                    ? "Cannot save while message is generating"
                    : "Save chat"
              }
            >
              {isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : <SaveIcon style={{ fontSize: '1.25rem' }} />}
            </button>
            <button
              onClick={() => setFileDialog({ visible: true, mode: 'save' })}
              disabled={isSaving || isStreaming}
              className="w-8 h-8 flex items-center justify-center text-black hover:text-blue-600 disabled:text-gray-400"
              title={
                isSaving
                  ? "Saving…"
                  : isStreaming
                    ? "Cannot save while message is generating"
                    : "Save chat as..."
              }
            >
              <SaveAsIcon style={{ fontSize: '1.25rem' }} />
            </button>
            <button
              onClick={async () => {
                if (!chatTitle || chatTitle === "untitled chat") return;
                const confirmed = window.confirm(`Are you sure you want to delete "${chatTitle}"?`);
                if (!confirmed) return;
                try {
                  const response = await fetch(`${API_ENDPOINTS.DELETE_CHAT}/${encodeURIComponent(chatTitle)}`, {
                    method: 'DELETE'
                  });
                  if (!response.ok) throw new Error('Failed to delete chat');
                  setMessages([]);
                  setChatTitle("untitled chat");
                  await refreshChats();
                } catch (error) {
                  console.error('Failed to delete chat:', error);
                  alert('Failed to delete chat');
                }
              }}
              disabled={chatTitle === "untitled chat" || isSaving}
              className="w-8 h-8 flex items-center justify-center text-black hover:text-red-600 disabled:text-gray-400"
              title={chatTitle === "untitled chat" ? "Cannot delete untitled chat" : "Delete chat"}
            >
              ✕
            </button>
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
                placeholder="Type your message…"
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
      
      {fileDialog.visible && fileDialog.mode && (
        <FileDialog
          mode={fileDialog.mode}
          type="chat"
          defaultFilename={fileDialog.mode === 'save' ? chatTitle : ''}
          onSelect={(filename, options) => {
            setFileDialog({ visible: false, mode: null });
            if (fileDialog.mode === 'open') {
              loadChat(filename).then((result) => {
                if (result) {
                  setChatTitle(filename);
                  if (options?.loadPrompt) {
                    if (result.system_prompt) {
                      setSystemPrompt(result.system_prompt);
                    }
                    if (result.temperature !== undefined) {
                      setTemperature(result.temperature);
                    }
                  }
                }
              }).catch((err) => {
                console.error('Failed to load chat:', err);
                alert('Failed to load chat');
              });
            } else if (fileDialog.mode === 'save') {
              setChatTitle(filename);
              doSaveChat(filename);
            }
          }}
          onCancel={() => {
            setFileDialog({ visible: false, mode: null });
          }}
        />
      )}
    </>
  );
} 