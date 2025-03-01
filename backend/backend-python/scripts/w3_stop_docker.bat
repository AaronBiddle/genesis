@echo off
setlocal

REM Clear previous container ID variable
set CONTAINERS=

REM Check if there's an existing container with the exact name "python-backend"
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=^python-backend$"') do set CONTAINERS=%%i

if defined CONTAINERS (
    echo Removing existing container...
    docker stop python-backend >nul 2>&1
    docker rm python-backend >nul 2>&1
) else (
    echo No existing container found.
)

endlocal
