import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { useWebSocket } from './useWebSocket';

const DEBUG_CHAT = true // Add this at the top

export function useAIChat() {
  // Pre-populate the chat history with a test markdown message.
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `# Welcome to the Chat!

This is a **test2 message** with markdown formatting. Try these examples:

- **Bold** text
- *Italic* text
- \`Inline code\`

\`\`\`javascript
// A code block example:
console.log('Hello, Markdown!');
\`\`\`
`
    }
  ]);

  const { isConnected, sendMessage, subscribeToMessages } = useWebSocket();
  // Holds the index of the chat message currently being streamed
  const currentMessageIndexRef = useRef<number | null>(null);

  useEffect(() => {
    subscribeToMessages((data) => {
      if (DEBUG_CHAT) console.log('🤖 AI Chat: Processing chat data:', data);
      
      if (data.channel === "chatStream") {
        if (data.token) {
          const index = currentMessageIndexRef.current;
          if (index !== null) {
            if (DEBUG_CHAT) console.log('🤖 AI Chat: Adding token to message:', data.token);
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
          if (DEBUG_CHAT) console.log('🤖 AI Chat: Chat stream complete');
          currentMessageIndexRef.current = null;
        }
      } else if (data.error) {
        if (DEBUG_CHAT) console.error("AI Chat: Error from server:", data.error);
      }
    });
  }, [subscribeToMessages]);

  // Sends the prompt to the AI API and adds a new chat message in state.
  const sendPrompt = (prompt: string) => {
    if (isConnected) {
      if (DEBUG_CHAT) console.log('🤖 Sending prompt:', prompt);
      setMessages((prev) => {
        const newMessages: ChatMessage[] = [
          ...prev,
          { role: 'user', content: prompt },
          { role: 'assistant', content: '' }
        ];
        currentMessageIndexRef.current = newMessages.length - 1;
        return newMessages;
      });
      // Format the message to match what the Python backend expects
      sendMessage({
        prompt: prompt
      });
    }
  };

  return { messages, isConnected, sendPrompt };
} 