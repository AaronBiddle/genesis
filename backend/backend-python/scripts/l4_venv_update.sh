#!/bin/bash
echo "First generate requirements.txt from within the Docker container:"

# Navigate to the 'app' directory
cd ../app

# Check if the virtual environment already exists
if [ -d "venv" ]; then
    echo "Virtual environment 'venv' already exists."
else
    echo "Creating virtual environment in 'app/venv'..."
    python3 -m venv venv
fi

# Activating the virtual environment
source venv/bin/activate

# Display Python version and full path for verification
echo "Current Python version:"
python --version
echo "Python executable path:"
python -c "import sys; print(sys.executable)"

# Confirm activation
echo "Virtual environment should now be active. Continue?"

# Wait for user confirmation
read -p "Press Enter to continue with pip install or Ctrl+C to abort..."

# Installing dependencies
pip install -r requirements.txt

# Final confirmation
echo "Dependencies installed successfully."

# Deactivating the virtual environment
deactivate

# Confirm deactivation
echo "Virtual environment should now be deactivated."

cd ..