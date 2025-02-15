const getEnvVar = (key: keyof ImportMetaEnv, fallback?: string): string => {
  const value = import.meta.env[key]
  if (!value && !fallback) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || fallback || ''
}

// WebSocket connection URL
export const WS_URL = getEnvVar('VITE_WS_URL', 'ws://localhost:8000/ws/chat')

// API URLs
export const API_BASE_URL = getEnvVar('VITE_API_URL', 'http://localhost:8000')

export const API_ENDPOINTS = {
  // Chat persistence endpoints
  LIST_CHATS: `${API_BASE_URL}/chats/list`,
  SAVE_CHAT: `${API_BASE_URL}/chats/save`,
  LOAD_CHAT: `${API_BASE_URL}/chats/load`,
  DELETE_CHAT: `${API_BASE_URL}/chats/delete`,

  // Document endpoints
  LIST_DOCUMENTS: `${API_BASE_URL}/documents/list`,
  SAVE_DOCUMENT: `${API_BASE_URL}/documents/save`,
  LOAD_DOCUMENT: `${API_BASE_URL}/documents/load`,
  DELETE_DOCUMENT: `${API_BASE_URL}/documents/delete`,

  // AI Chat endpoint (WebSocket)
  AI_CHAT: `${API_BASE_URL}/ws/chat`,
} as const 