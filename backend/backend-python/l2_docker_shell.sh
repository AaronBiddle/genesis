#!/bin/bash

# Manual startup command inside container:
# uvicorn main:app --host 0.0.0.0 --port 8000

# Function to create new container
create_container() {
    docker run --name python-backend -d \
        -p 8000:8000 \
        -v $(pwd)/app:/app \
        python-backend \
        tail -f /dev/null
}

# Check if container exists and its state
CONTAINER_ID=$(docker ps -aq -f name=python-backend)
if [ -n "$CONTAINER_ID" ]; then
    # Get container status
    STATUS=$(docker inspect -f '{{.State.Status}}' python-backend)
    
    if [ "$STATUS" = "running" ]; then
        echo "Container is already running..."
    else
        echo "Container exists but not running (status: $STATUS). Removing and recreating..."
        docker rm python-backend >/dev/null 2>&1
        create_container
    fi
else
    echo "No container found. Creating new container..."
    create_container
fi

# Wait a moment for container to be running
sleep 2

# Verify container is actually running
STATUS=$(docker inspect -f '{{.State.Status}}' python-backend 2>/dev/null)
if [ "$STATUS" != "running" ]; then
    echo "Error: Container failed to start properly. Status: $STATUS"
    exit 1
fi

echo "Connecting to container..."
docker exec -it python-backend /bin/bash