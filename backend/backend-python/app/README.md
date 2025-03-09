# Genesis Backend Python API

This is the Python backend API for the Genesis application, providing AI chat capabilities and file management.

## Project Structure

```
app/
├── config/                 # Configuration files
│   └── models.yaml         # Model configuration
├── routes/                 # API routes
│   ├── ai_chat.py          # WebSocket endpoint for AI chat
│   ├── file_operations.py  # Unified API for file operations
│   ├── directory.py        # Endpoints for directory operations
│   ├── models.py           # Endpoints for model information
│   └── worker_connection.py # Endpoints for worker connections
├── services/               # Business logic services
│   ├── chat_service.py     # Chat processing logic
│   ├── file_manager.py     # File management operations
│   ├── file_services.py    # File-related services
│   ├── model_service.py    # Model selection and configuration
│   ├── openai_client.py    # OpenAI API client
│   └── websocket_service.py # WebSocket connection management
├── utils/                  # Utility functions
│   ├── config.py           # Configuration loading and management
│   └── logging.py          # Logging utilities
├── worker/                 # Background worker processes
├── .env                    # Environment variables
├── main.py                 # Application entry point
├── requirements.txt        # Python dependencies
└── run.sh                  # Startup script
```

## Key Components

### Main Application

- `main.py`: The entry point for the FastAPI application, configuring CORS and registering routes.

### Routes

- `ai_chat.py`: WebSocket endpoint for real-time AI chat.
- `file_operations.py`: Unified REST API for file operations (documents, chats, prompts).
- `directory.py`: REST endpoints for directory operations.
- `models.py`: REST endpoints for model information.
- `worker_connection.py`: WebSocket endpoint for worker connections.

### Services

- `chat_service.py`: Handles chat message processing and streaming responses.
- `model_service.py`: Manages model selection and configuration.
- `openai_client.py`: Client for interacting with the OpenAI API.
- `websocket_service.py`: Manages WebSocket connections.
- `file_manager.py`: Handles file operations.
- `file_services.py`: Provides file-related services.

### Utilities

- `config.py`: Loads and manages configuration from YAML files.
- `logging.py`: Provides logging utilities with different log levels.

## Environment Variables

The application uses the following environment variables:

- `DEEPSEEK_API_KEY`: API key for DeepSeek API.
- `DEEPSEEK_API_BASE_URL`: Base URL for DeepSeek API.
- `DEFAULT_MODEL`: Default model to use for chat.
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS.
- `APP_DIR`: Application directory.
- `CONFIG_DIR`: Configuration directory.
- `USER_DATA_DIR`: User data directory.
- `DOCUMENTS_DIR`: Documents directory.
- `CHATS_DIR`: Chats directory.
- `PROMPTS_DIR`: Prompts directory.

## Running the Application

To run the application:

```bash
./run.sh [log_level]
```

Where `log_level` is:
- `1`: MINIMUM logging (default)
- `2`: DEBUGGING logging

## API Documentation

When the application is running, you can access the API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

# Backend API Documentation

## Unified File Operations API

The backend implements a unified API for file operations that handles different types of content (documents, chats, prompts) through a consistent interface. This design reduces code duplication and provides a more maintainable codebase.

### API Endpoints

#### File Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/files/{file_type}/save` | Save a file of the specified type |
| GET | `/files/{file_type}/list` | List all files of the specified type |
| POST | `/files/{file_type}/load` | Load a file of the specified type |
| DELETE | `/files/{file_type}/delete/{filename}` | Delete a file of the specified type |

Where `{file_type}` can be one of:
- `document` - Plain text documents
- `chat` - Chat history with messages, system prompt, and temperature
- `prompt` - Prompt templates

#### Directory Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/directory/list` | List contents of a directory |
| GET | `/directory/list/{path}` | List contents of a specific directory path |
| POST | `/directory/create` | Create a new directory |

#### AI Chat

| Method | Path | Description |
|--------|------|-------------|
| WebSocket | `/ws/chat` | WebSocket endpoint for AI chat |

#### Worker Connection

| Method | Path | Description |
|--------|------|-------------|
| WebSocket | `/ws/worker-test` | Test WebSocket endpoint for worker connections |
| WebSocket | `/ws/worker-connect` | WebSocket endpoint for worker to connect to the backend |
| WebSocket | `/ws/frontend-requests` | WebSocket endpoint for frontend to send requests to the backend |
| POST | `/send-to-frontend` | Send a message to the connected frontend client |

#### Models

| Method | Path | Description |
|--------|------|-------------|
| GET | `/models` | Get all available models and their configurations |

### Request/Response Examples

#### Saving a Document

```http
POST /files/document/save
Content-Type: application/json

{
  "filename": "example.txt",
  "file_type": "document",
  "content": "This is the content of the document."
}
```

Response:
```json
{
  "status": "success",
  "message": "document saved successfully",
  "filename": "example.txt"
}
```

#### Saving a Chat

```http
POST /files/chat/save
Content-Type: application/json

{
  "filename": "example_chat.json",
  "file_type": "chat",
  "content": {
    "messages": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi there! How can I help you today?"}
    ],
    "system_prompt": "You are a helpful assistant.",
    "temperature": 0.7
  }
}
```

Response:
```json
{
  "status": "success",
  "message": "chat saved successfully",
  "filename": "example_chat.json"
}
```

#### Loading a Document

```http
POST /files/document/load
Content-Type: application/json

{
  "filename": "example.txt"
}
```

Response:
```json
{
  "filename": "example.txt",
  "content": "This is the content of the document."
}
```

#### Loading a Chat

```http
POST /files/chat/load
Content-Type: application/json

{
  "filename": "example_chat.json"
}
```

Response:
```json
{
  "filename": "example_chat.json",
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there! How can I help you today?"}
  ],
  "system_prompt": "You are a helpful assistant.",
  "temperature": 0.7
}
```

#### Listing Files

```http
GET /files/document/list
```

Response:
```json
{
  "files": [
    "example.txt",
    "folder/another_example.txt"
  ]
}
```

#### Deleting a File

```http
DELETE /files/document/delete/example.txt
```

Response:
```json
{
  "status": "success",
  "message": "document deleted successfully"
}
```

## Design Decisions

### Unified API Approach

The unified API approach was chosen to:

1. **Reduce Code Duplication**: The implementation uses a single set of endpoints for different file types.
2. **Provide Consistency**: A consistent API makes it easier for frontend developers to work with different file types.
3. **Simplify Maintenance**: Changes to file handling logic only need to be made in one place.
4. **Enable Future Extensions**: New file types can be added with minimal changes to the codebase.

### File Type Validation

The API validates that the file type in the request path matches the file type in the request body, ensuring that files are saved with the correct format and in the correct location.

### Path Safety

All file operations include path safety checks to prevent directory traversal attacks, ensuring that files can only be accessed within their designated base directories. 