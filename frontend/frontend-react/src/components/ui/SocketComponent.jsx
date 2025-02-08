import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

// Use the socket endpoint that your Flask-SocketIO server is running on
const socketEndpoint = 'http://localhost:5000';
const socket = io(socketEndpoint);

function SocketComponent() {
  // This will hold the concatenated streaming tokens
  const [chatStream, setChatStream] = useState('');
  // Optionally, also show standard messages (from the background task)
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for background messages
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg.data]);
    });

    // Listen for streaming chat tokens
    socket.on('chat_response', (data) => {
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
        { role: 'user', content: 'Tell me a short story.' }
      ]
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
}

export default SocketComponent;