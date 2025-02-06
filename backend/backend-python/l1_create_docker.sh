#!/bin/bash

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
docker run --name python-backend \
    -p 8000:8000 \
    -v $(pwd)/app:/app \
    python-backend

echo "If you see this message, the container exited unexpectedly."