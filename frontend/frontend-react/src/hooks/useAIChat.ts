import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  // Holds the index of the chat message currently being streamed
  const currentMessageIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/chat");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to AI Chat WebSocket");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Process streaming tokens sent on the "chatStream" channel
      if (data.channel === "chatStream") {
        if (data.token) {
          const index = currentMessageIndexRef.current;
          if (index !== null) {
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
          // Mark the end of the streaming session.
          currentMessageIndexRef.current = null;
        }
      } else if (data.error) {
        console.error("Error from server:", data.error);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from AI Chat WebSocket");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  // Sends the prompt to the AI API and adds a new chat message in state.
  const sendPrompt = (prompt: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      setMessages((prev) => {
        const newMessages: ChatMessage[] = [
          ...prev,
          { role: 'user' as const, content: prompt },
          { role: 'assistant' as const, content: '' }
        ];
        currentMessageIndexRef.current = newMessages.length - 1;
        return newMessages;
      });
      socketRef.current.send(JSON.stringify({ prompt }));
    }
  };

  return { messages, isConnected, sendPrompt };
} 