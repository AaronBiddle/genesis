import { useEffect, useRef } from 'react'
import { useWebSocket } from './useWebSocket'

export type Message = { [key: string]: any }

// Make Callback generic so subscribers can specify their expected message type.
export type Callback<T = Message> = (message: T) => void

export function useMessageBus() {
  const { isConnected, sendMessage, subscribeToMessages } = useWebSocket()
  // Registry mapping a message key to an array of callbacks.
  const handlersRef = useRef<Record<string, Callback<any>[]>>({})

  // Subscribe once to all incoming messages.
  useEffect(() => {
    subscribeToMessages((message: Message) => {
      // We assume messages include a `counter` field.
      const key = message.counter
      if (key && handlersRef.current[key]) {
        handlersRef.current[key].forEach(callback => callback(message))
      }
    })
  }, [subscribeToMessages])

  // Generic subscribe allows the caller to define the expected message shape.
  const subscribe = <T = Message>(messageType: string, callback: Callback<T>) => {
    if (!handlersRef.current[messageType]) {
      handlersRef.current[messageType] = []
    }
    handlersRef.current[messageType].push(callback)
    // Return an unsubscribe function.
    return () => {
      handlersRef.current[messageType] = handlersRef.current[messageType].filter(
        (cb) => cb !== callback
      )
    }
  }

  return {
    isConnected,
    sendMessage,
    subscribe,
  }
} 