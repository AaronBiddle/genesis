@echo off
setlocal

REM Build the Docker image
echo Building Docker image...
docker build -t python-backend .

REM Clear previous container ID variable
set CONTAINERS=

REM Check if there's an existing container with the same name
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=^python-backend$"') do set CONTAINERS=%%i

if defined CONTAINERS (
    echo Removing existing container...
    docker stop python-backend >nul 2>&1
    docker rm python-backend >nul 2>&1
) else (
    echo No existing container found.
)

REM Run the new container and follow logs
echo Starting new container...
docker run --name python-backend ^
    -p 8000:8000 ^
    -v %cd%/app:/app ^
    python-backend

echo If you see this message, the container exited unexpectedly.
