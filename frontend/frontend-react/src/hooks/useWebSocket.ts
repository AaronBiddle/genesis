import { useState, useEffect, useRef } from 'react'
import { useLoggingStore, LogLevel } from '../stores/loggingStore'
import { WS_URL } from '../config/constants'

export function useWebSocket() {
  const log = useLoggingStore(state => state.log)
  const namespace = '🌐 WebSocket:'
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

  const formatErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      return error.length > 500 ? error.substring(0, 500) + '...' : error
    }
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`
    }
    return JSON.stringify(error, null, 2).substring(0, 500) + '...'
  }

  const subscribeToMessages = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.done === true) {
            const sentTokens = data.tokensSent ? `sent: ${data.tokensSent}, ` : ''
            const receivedTokens = data.tokensReceived ? `received: ${data.tokensReceived}` : ''
            log(LogLevel.INFO, namespace, `Response completed (${sentTokens}${receivedTokens} tokens)`)
          } else if (data.error) {
            const formattedError = formatErrorMessage(data.error)
            log(LogLevel.ERROR, namespace, 'Error:', formattedError)
            if (data.size && data.limit) {
              log(LogLevel.ERROR, namespace, `Message size ${data.size} exceeds limit of ${data.limit} bytes`)
            }
          } else {
            log(LogLevel.DEBUG, namespace, 'Incoming message:', data)
          }
          
          callback(data)
        } catch (error) {
          log(LogLevel.ERROR, namespace, 'Failed to process message:', formatErrorMessage(error))
        }
      }
    }
  }

  return {
    isConnected,
    sendMessage,
    subscribeToMessages
  }
} 