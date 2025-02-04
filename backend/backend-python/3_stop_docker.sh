#!/bin/bash


# Check if there's an existing container with the same name
if [ "$(docker ps -aq -f name=python-backend)" ]; then
    echo "Removing existing container..."
    docker stop python-backend
    docker rm python-backend
fi
