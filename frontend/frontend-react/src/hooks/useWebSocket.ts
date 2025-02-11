import { useState, useEffect, useRef } from 'react'

const DEBUG_WEBSOCKET = false

const LOG_LEVEL = {
  NONE: 0,
  MINIMUM: 1,
  DEBUGGING: 2
} as const

const CURRENT_LOG_LEVEL = LOG_LEVEL.MINIMUM  // Default to basic logging

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
      if (CURRENT_LOG_LEVEL >= LOG_LEVEL.MINIMUM) {
        console.log('📤 WebSocket: Sending message')
      }
      if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUGGING) {
        console.log('📤 WebSocket: Message content:', message)
      }
      socketRef.current.send(JSON.stringify(message))
    }
  }

  const subscribeToMessages = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        // Only log complete messages at MINIMUM level
        if (CURRENT_LOG_LEVEL >= LOG_LEVEL.MINIMUM) {
          if (data.done === true) {
            console.log('📥 WebSocket: Response completed')
          } else if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUGGING) {
            console.log('📥 WebSocket: Incoming message:', data)
          }
        }
        
        if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUGGING) {
          console.log('📥 Websocket raw event:', event)
        }
        
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