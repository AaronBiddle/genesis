# Genesis Backend Python API

This is the Python backend API for the Genesis application, providing AI chat capabilities and file management.

## Project Structure

```
app/
├── config/                 # Configuration files
│   └── models.yaml         # Model configuration
├── routes/                 # API routes
│   ├── ai_chat.py          # WebSocket endpoint for AI chat
│   ├── chats.py            # Endpoints for chat history
│   ├── directory.py        # Endpoints for directory operations
│   ├── documents.py        # Endpoints for document operations
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
- `chats.py`: REST endpoints for managing chat history.
- `documents.py`: REST endpoints for document operations.
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