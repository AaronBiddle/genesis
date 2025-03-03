@echo off
setlocal

REM Attempting to join the running docker container named python-backend

echo Joining the running docker container...
docker exec -it python-backend bash

REM If the container is not running, the command will return an error. 