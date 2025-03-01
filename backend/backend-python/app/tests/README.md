# WebSocket Test Clients

This directory contains test clients for the WebSocket endpoints in the application.

## Available Test Clients

1. `ws_client_test.py` - Tests the basic worker-test WebSocket endpoint
2. `worker_connect_test.py` - Tests the worker connection and frontend request functionality

## How to Use

### Testing Worker Connection

To test the worker connection endpoint, run:

```bash
python worker_connect_test.py
```

This will:
- Connect to the `/ws/worker-connect` endpoint
- Keep the connection alive
- Process any messages received from the server
- Handle forwarded requests from the frontend

### Testing Frontend Requests

To test the frontend requests endpoint, run:

```bash
python worker_connect_test.py frontend
```

This will:
- Connect to the `/ws/frontend-requests` endpoint
- Send JSON messages with a "text" field
- Print the responses received from the server

## Testing the Complete Flow

To test the complete flow:

1. Start the FastAPI server
2. In one terminal, run the worker connection test: `python worker_connect_test.py`
3. In another terminal, run the frontend request test: `python worker_connect_test.py frontend`

You should see:
- The worker connecting and waiting for messages
- The frontend sending requests
- The server forwarding frontend requests to the worker
- The worker processing these requests and responding

This demonstrates the full communication flow between frontend, backend, and worker components. 