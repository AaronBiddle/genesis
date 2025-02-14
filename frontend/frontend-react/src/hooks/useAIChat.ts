import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { useWebSocket } from './useWebSocket';
import { useChatSettings } from '../stores/chatSettingsStore';
import { useLoggingStore, LogLevel } from '../stores/loggingStore';

export function useAIChat() {
  const log = useLoggingStore(state => state.log);
  const namespace = '🤖 AI Chat:';
  
  // Pre-populate the chat history with a test markdown message.
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { isConnected, sendMessage, subscribeToMessages } = useWebSocket();
  // Holds the index of the chat message currently being streamed
  const currentMessageIndexRef = useRef<number | null>(null);

  const { systemPrompt, temperature } = useChatSettings();

  // Add removeMessage function
  const removeMessage = (index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    subscribeToMessages((data) => {
      log(LogLevel.DEBUG, namespace, 'Processing chat data:', data);
      
      if (data.channel === "chatStream") {
        if (data.token) {
          const index = currentMessageIndexRef.current;
          if (index !== null) {
            log(LogLevel.DEBUG, namespace, 'Adding token to message:', data.token);
            setMessages((prev) => {
              const newMessages = [...prev];
              const currentMsg = newMessages[index];
              newMessages[index] = {
                ...currentMsg,
                content: currentMsg.content + data.token,
              };
              return newMessages;
            });
          }
        }
        if (data.done === true) {
          log(LogLevel.DEBUG, namespace, 'Chat stream complete');
          currentMessageIndexRef.current = null;
        }
      } else if (data.error) {
        log(LogLevel.ERROR, namespace, "Error from server:", data.error);
      }
    });
  }, [subscribeToMessages]);

  // Sends the prompt to the AI API and adds a new chat message in state.
  const sendPrompt = (prompt: string) => {
    if (isConnected) {
      log(LogLevel.DEBUG, namespace, 'Sending prompt:', prompt);
      setMessages((prev) => {
        const newMessages: ChatMessage[] = [
          ...prev,
          { role: 'user', content: prompt },
          { role: 'assistant', content: '' }
        ];
        currentMessageIndexRef.current = newMessages.length - 1;
        return newMessages;
      });
      // Format the message to include chat history
      sendMessage({
        prompt: prompt,
        system_prompt: systemPrompt,
        temperature: temperature,
        history: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });
    }
  };

  const saveChat = async (filename: string) => {
    try {
      const response = await fetch('http://localhost:8000/save_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          messages,
          system_prompt: systemPrompt,
          temperature: temperature
        })
      });
      
      if (!response.ok) throw new Error('Save failed');
      return await response.json();
    } catch (error) {
      console.error('Error saving chat:', error);
      throw error;
    }
  };

  const loadChat = async (filename: string) => {
    try {
      const response = await fetch('http://localhost:8000/load_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      
      if (!response.ok) throw new Error('Load failed');
      const data = await response.json();
      
      setMessages(data.messages);
      
      return data;
    } catch (error) {
      console.error('Error loading chat:', error);
      throw error;
    }
  };

  return { 
    messages, 
    setMessages,
    isConnected, 
    sendPrompt,
    removeMessage,
    saveChat,
    loadChat
  };
} 