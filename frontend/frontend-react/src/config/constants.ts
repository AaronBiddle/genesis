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
  LIST_CHATS: `${API_BASE_URL}/list_chats`,
  SAVE_CHAT: `${API_BASE_URL}/save_chat`,
  LOAD_CHAT: `${API_BASE_URL}/load_chat`,
  LIST_FILES: `${API_BASE_URL}/list_files`,
  SAVE_DOCUMENT: `${API_BASE_URL}/save_document`,
  LOAD_DOCUMENT: `${API_BASE_URL}/load_document`,
} as const 