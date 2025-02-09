import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { ChatMessage } from '../../types/chat';

// Updated connection (port 8000)
const socketEndpoint = 'http://localhost:8000';
const socket: Socket = io(socketEndpoint);

interface Message {
  data: string;
}

interface ChatResponse {
  response: string;
}

const SocketComponent: React.FC = () => {
  // This will hold the concatenated streaming tokens
  const [chatStream, setChatStream] = useState<string>('');
  // Optionally, also show standard messages (from the background task)
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Listen for background messages
    socket.on('message', (msg: Message) => {
      setMessages((prev) => [...prev, msg.data]);
    });

    // Listen for streaming chat tokens
    socket.on('chat_response', (data: ChatResponse) => {
      // Append each token to the current streaming chat message
      setChatStream((prev) => prev + data.response);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Function to send a chat message event via Socket.IO.
  // This should trigger your server to start streaming tokens.
  const sendChatMessage = () => {
    const payload = {
      messages: [
        { role: 'user' as const, content: 'Tell me a short story.' }
      ] as ChatMessage[]
    };
    // Reset the chat stream when starting a new message
    setChatStream('');
    socket.emit('chat_message', payload);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Socket Streaming Demo</h1>
      <button onClick={sendChatMessage}>Send Chat Message</button>
      <h2>Streaming Chat Response:</h2>
      <p>{chatStream}</p>

      <h2>Other Messages:</h2>
      {messages.map((msg, idx) => (
        <div key={idx}>{msg}</div>
      ))}
    </div>
  );
};

export default SocketComponent;