import { useState, useEffect, useRef } from 'react'

const DEBUG_WEBSOCKET = false

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/chat')
    socketRef.current = socket

    socket.onopen = () => {
      if (DEBUG_WEBSOCKET) console.log('🌐 WebSocket Connected')
      setIsConnected(true)
    }

    socket.onclose = () => {
      if (DEBUG_WEBSOCKET) console.log('🌐 WebSocket Disconnected')
      setIsConnected(false)
    }

    socket.onerror = (error) => {
      if (DEBUG_WEBSOCKET) console.log('🌐 WebSocket Error:', error)
    }

    return () => {
      socket.close()
    }
  }, [])

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      if (DEBUG_WEBSOCKET) console.log('📤 Websocket Sending message:', message)
      socketRef.current.send(JSON.stringify(message))
    }
  }

  const subscribeToMessages = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (DEBUG_WEBSOCKET) console.log('📥 WebsocketReceived message:', data)
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