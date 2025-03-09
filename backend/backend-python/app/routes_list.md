# API Routes Reference

This document provides a reference for all available API endpoints and WebSocket connections in the application, organized by file.

## ai_chat.py

| Method | Path | Description |
|--------|------|-------------|
| WebSocket | `/ws/chat` | WebSocket endpoint for AI chat |

## chats.py

| Method | Path | Description | Request Body |
|--------|------|-------------|-------------|
| POST | `/chats/save` | Save chat history to a file | `{ "filename": "string", "messages": "list", "system_prompt": "string", "temperature": "float" }` |
| GET | `/chats/list` | List all available chat files | - |
| POST | `/chats/load` | Load a chat file | `{ "filename": "string" }` |
| DELETE | `/chats/delete/{filename}` | Delete a chat file using standard DELETE method | - |
| POST | `/chats/load_chat` | Load a chat file (legacy endpoint) | `{ "filename": "string" }` |
| POST | `/chats/save_chat` | Save chat history (legacy endpoint) | `{ "filename": "string", "messages": "list", "system_prompt": "string", "temperature": "float" }` |
| POST | `/chats/delete_chat/{filename}` | Delete a chat file (legacy endpoint) | - |
| POST | `/chats/delete` | Delete a chat file (alternative endpoint) | `{ "filename": "string" }` |

## directory.py

| Method | Path | Description | Query Parameters |
|--------|------|-------------|-----------------|
| GET | `/directory/list` | List contents of a directory | `file_type=chat|document|prompt` |
| GET | `/directory/list/{path}` | List contents of a specific directory path | `file_type=chat|document|prompt` |
| POST | `/directory/create` | Create a new directory | `path=string&file_type=chat|document|prompt` |

## documents.py

| Method | Path | Description | Request Body |
|--------|------|-------------|-------------|
| POST | `/documents/save` | Save a document to a file | `{ "filename": "string", "content": "string" }` |
| GET | `/documents/list` | List all available document files | - |
| POST | `/documents/load` | Load a document from a file | `{ "filename": "string" }` |
| DELETE | `/documents/delete/{filename}` | Delete a document file | - |

## models.py

| Method | Path | Description |
|--------|------|-------------|
| GET | `/models` | Get all available models and their configurations |

## worker_connection.py

| Method | Path | Description | Request Body |
|--------|------|-------------|-------------|
| WebSocket | `/ws/worker-test` | Test WebSocket endpoint for worker connections | - |
| WebSocket | `/ws/worker-connect` | WebSocket endpoint for worker to connect to the backend | - |
| WebSocket | `/ws/frontend-requests` | WebSocket endpoint for frontend to send requests to the backend | - |
| POST | `/send-to-frontend` | Send a message to the connected frontend client | `{ "message": "dict" }` | 