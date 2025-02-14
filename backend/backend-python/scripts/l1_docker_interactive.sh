#!/bin/bash

# Navigate to the project root directory (one level up from scripts)
cd "$(dirname "$0")/.."

# Build the Docker image
echo "Building Docker image..."
docker build -t python-backend .

# Check if there's an existing container with the same name
if [ "$(docker ps -aq -f name=python-backend)" ]; then
    echo "Removing existing container..."
    docker stop python-backend
    docker rm python-backend
fi

# Run the new container and follow logs
echo "Starting new container..."
docker run -it --name python-backend \
    -p 8000:8000 \
    -v $(pwd)/app:/app \
    -v $(pwd)/../user-data:/user-data \
    python-backend bash

echo "Container has stopped."