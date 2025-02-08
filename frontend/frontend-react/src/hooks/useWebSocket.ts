import { useState, useEffect, useRef } from 'react'

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws')
    socketRef.current = socket

    socket.onopen = () => {
      console.log('Connected to Python WebSocket')
      setIsConnected(true)
    }

    socket.onclose = () => {
      console.log('Disconnected from WebSocket')
      setIsConnected(false)
    }

    return () => {
      socket.close()
    }
  }, [])

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    }
  }

  const subscribeToMessages = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        callback(data)
      }
    }
  }

  return {
    isConnected,
    sendMessage,
    subscribeToMessages
  }
} 