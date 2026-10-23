@echo off
node "%~dp0dist\cli.js" %*
exit /b %errorlevel%
