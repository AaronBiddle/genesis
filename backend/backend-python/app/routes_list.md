# API Routes Reference

This document provides a reference for all available API endpoints and WebSocket connections in the application, organized by file.

## ai_chat.py

| Method | Path | Description |
|--------|------|-------------|
| WebSocket | `/ws/chat` | WebSocket endpoint for AI chat |

## file_operations.py (Unified File API)

| Method | Path | Description | Request Body / Query Parameters |
|--------|------|-------------|--------------------------------|
| POST | `/files/{file_type}/save` | Save a file of the specified type | `{ "filename": "string", "file_type": "string", "content": "string or object" }` |
| GET | `/files/{file_type}/list` | List all files of the specified type | `file_type` can be "document", "chat", or "prompt" |
| POST | `/files/{file_type}/load` | Load a file of the specified type | `{ "filename": "string" }` |
| DELETE | `/files/{file_type}/delete/{filename}` | Delete a file of the specified type | - |

## directory.py

| Method | Path | Description | Query Parameters |
|--------|------|-------------|-----------------|
| GET | `/directory/list` | List contents of a directory | `file_type=chat|document|prompt` |
| GET | `/directory/list/{path}` | List contents of a specific directory path | `file_type=chat|document|prompt` |
| POST | `/directory/create` | Create a new directory | `path=string&file_type=chat|document|prompt` |

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