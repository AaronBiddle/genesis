@echo off
setlocal

REM Clear previous container ID variable
set CONTAINERS=

REM Manual startup command inside container:
REM uvicorn main:app --host 0.0.0.0 --port 8000

REM Check if there's an existing container with the same name
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=^python-backend$"') do set CONTAINERS=%%i

if defined CONTAINERS (
    echo Container exists. Ensuring it's running...
    docker start python-backend >nul 2>&1
) else (
    echo No container found. Creating new container...
    docker run --name python-backend -d ^
        -p 8000:8000 ^
        -v %cd%/app:/app ^
        python-backend ^
        tail -f /dev/null
)

REM Connect to the container
docker exec -it python-backend /bin/bash

REM Only pause if there was an error
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Press any key to close this window...
    pause >nul
)