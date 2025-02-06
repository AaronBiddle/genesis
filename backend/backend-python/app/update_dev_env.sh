#!/bin/bash

# Exit on any error
set -e

if [ ! -d "venv" ]; then
    echo "No virtual environment found. Please run setup_dev_env.sh first"
    exit 1
fi

echo "Updating development environments..."

# First, update the real requirements.txt
echo "Updating requirements.txt..."
pip freeze > requirements.txt

# Now update the IDE's venv
echo "Updating IDE's virtual environment..."
source venv/bin/activate
pip install -r requirements.txt
deactivate

echo "Development environment update complete!"
echo "requirements.txt has been updated"
echo "IDE's venv has been synchronized with current packages" 