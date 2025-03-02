#!/bin/bash

# Usage:
#   ./run.sh [log_level]
#     log_level: 1 for MINIMUM (default), 2 for DEBUGGING
#   Examples:
#     ./run.sh        # Runs with MINIMUM logging (level 1)
#     ./run.sh 2      # Runs with DEBUGGING logging (level 2)

# Get log level from command line argument, default to 1 (MINIMUM)
log_level=${1:-1}

# Copy .env file from mounted location to app directory
cp /config/.env /app/.env

# Pass log level as an environment variable to uvicorn
LOG_LEVEL=$log_level uvicorn main:app --host 0.0.0.0 --port 8000