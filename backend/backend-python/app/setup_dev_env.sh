#!/bin/bash

# Exit on any error
set -e

echo "Setting up Python development environment..."

# Remove existing venv if it exists
if [ -d "venv" ]; then
    echo "Removing existing virtual environment..."
    rm -rf venv
fi

# Create new virtual environment
echo "Creating new virtual environment..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements from app/requirements.txt..."
pip install -r requirements.txt

echo "Development environment setup complete!"
echo "To activate the virtual environment, run: source venv/bin/activate"