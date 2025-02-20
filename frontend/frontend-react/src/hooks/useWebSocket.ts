import { useState, useEffect, useRef } from 'react'
import { useLoggingStore, LogLevel } from '../stores/loggingStore'
import { WS_URL } from '../config/constants'

export function useWebSocket() {
  const log = useLoggingStore(state => state.log)
  const namespace = 'useWebSocket:'
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socketRef.current = socket

    socket.onopen = () => {
      log(LogLevel.INFO, namespace, 'Connection established')
      setIsConnected(true)
    }

    socket.onclose = (event) => {
      const closeInfo = {
        code: event.code,
        reason: event.reason || 'No reason provided',
        wasClean: event.wasClean,
        timestamp: new Date().toISOString()
      }
      
      log(LogLevel.INFO, namespace, `Connection closed: ${closeInfo.reason} (Code: ${closeInfo.code}, Clean: ${closeInfo.wasClean})`)
      setIsConnected(false)
    }

    socket.onerror = () => {
      const errorInfo = {
        url: WS_URL,
        timestamp: new Date().toISOString(),
        connectionState: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socket.readyState],
        protocol: socket.protocol || 'none'
      }

      log(LogLevel.ERROR, namespace, 'Failed to establish WebSocket connection:', errorInfo)
      setIsConnected(false)
    }

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        log(LogLevel.INFO, namespace, 'Closing connection (component cleanup)')
        socket.close()
      }
    }
  }, [])

  const sendMessage = (message: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      log(LogLevel.INFO, namespace, 'Sending message')
      log(LogLevel.DEBUG, namespace, 'Message content:', message)
      socketRef.current.send(JSON.stringify(message))
    }
  }


  const subscribeToMessages = (callback: (data: any) => void) => {
    if (!socketRef.current) return;

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Only log if it's the final message or an error
      if (data.done === true || data.error) {
        log(LogLevel.DEBUG, namespace, 'Received message:', data);
      }
      callback(data);
    };
  }

  return {
    isConnected,
    sendMessage,
    subscribeToMessages
  }
} 