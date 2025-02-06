#!/bin/bash

# Exit on any error
set -e

echo "Setting up IDE Python environment..."

# First capture current requirements
echo "Capturing current requirements..."
pip freeze > requirements.txt

# Remove existing venv if it exists
if [ -d "venv" ]; then
    echo "Virtual environment already exists. For updates, use update_dev_env.sh"
    echo "To force a clean install, delete venv directory first."
    exit 1
fi

# Create new virtual environment for IDE
echo "Creating new virtual environment for IDE..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip in venv
echo "Upgrading pip in venv..."
pip install --upgrade pip

# Install requirements in venv for IDE support
echo "Installing requirements in venv for IDE support..."
pip install -r requirements.txt

# Deactivate venv
echo "Deactivating virtual environment..."
deactivate

echo "IDE environment setup complete!"
echo "Note: For Docker/production dependencies, use pip install while venv is NOT active"
echo "To activate the venv for IDE support only: source venv/bin/activate"