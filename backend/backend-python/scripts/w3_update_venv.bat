@echo off
echo First generate requirements.txt from within the Docker container:

REM Navigate to the 'app' directory
cd ../app

REM Check if the virtual environment already exists
IF EXIST venv (
    echo Virtual environment "venv" already exists.
) ELSE (
    echo Creating virtual environment in "app\venv"...
    python -m venv venv
)

REM Activating the virtual environment
call venv\Scripts\activate

REM Confirm activation (will show the environment name in the prompt)
echo Virtual environment should now be active. Continue?

REM Display Python version and full path for verification
echo Current Python version:
python --version
echo Python executable path:
python -c "import sys; print(sys.executable)"

REM Pause to ensure you see the activated environment
pause

REM Installing dependencies
pip install -r requirements.txt

REM Final confirmation
echo Dependencies installed successfully.
pause

REM Deactivating the virtual environment
call venv\Scripts\deactivate

REM Confirm deactivation (will show the prompt again)
echo Virtual environment should now be deactivated.

cd ..
